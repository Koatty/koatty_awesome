# 中间件教程

中间件是 Koatty 的核心概念，基于 Koa 的洋葱圈模型，每个中间件都可以在处理请求前后执行逻辑。

## 目录

- [基本概念](#基本概念)
- [创建中间件](#创建中间件)
- [使用中间件](#使用中间件)
- [协议特定中间件](#协议特定中间件)
- [路由中间件](#路由中间件)
- [常用中间件示例](#常用中间件示例)

## 基本概念

### 洋葱圈模型

```
请求 → 中间件1 → 中间件2 → 中间件3 → 控制器
响应 ← 中间件1 ← 中间件2 ← 中间件3 ← 控制器
```

每个中间件可以：
1. 在 `next()` 之前执行代码（请求处理前）
2. 等待后续中间件执行完成
3. 在 `next()` 之后执行代码（响应处理后）

### 中间件执行顺序

中间件按照配置的顺序依次执行，遵循**先进后出**的原则。

## 创建中间件

### 基本结构

```typescript
import { Middleware } from 'koatty';
import { App } from '../App';

@Middleware()
export class MyMiddleware {
  run(options: any, app: App) {
    // options: 中间件配置
    // app: 应用实例
    
    return async (ctx: any, next: any) => {
      // 请求处理前逻辑
      console.log('Before request');
      
      // 执行后续中间件
      await next();
      
      // 响应处理后逻辑
      console.log('After response');
    };
  }
}
```

### 完整示例

```typescript
import { Middleware } from 'koatty';
import { App } from '../App';

@Middleware()
export class LoggerMiddleware {
  run(options: any, app: App) {
    // 配置项
    const config = {
      logBody: options?.logBody ?? false,
      ignorePaths: options?.ignorePaths || []
    };
    
    return async (ctx: any, next: any) => {
      // 检查是否需要忽略
      if (config.ignorePaths.some(path => ctx.path.includes(path))) {
        return await next();
      }
      
      const start = Date.now();
      
      // 记录请求
      console.log(`→ ${ctx.method} ${ctx.url}`);
      
      if (config.logBody && ctx.requestBody) {
        console.log('  Body:', ctx.requestBody);
      }
      
      try {
        // 执行后续逻辑
        await next();
        
        const duration = Date.now() - start;
        
        // 记录响应
        console.log(`← ${ctx.status} - ${duration}ms`);
        
      } catch (error) {
        const duration = Date.now() - start;
        console.error(`✖ ${ctx.status} - ${duration}ms`, error);
        throw error;
      }
    };
  }
}
```

## 使用中间件

### 全局中间件

在 `config/middleware.ts` 中配置：

```typescript
export default {
  // 中间件加载顺序
  list: [
    'TraceMiddleware',     // 1. 链路追踪
    'CorsMiddleware',      // 2. 跨域处理
    'PayloadMiddleware',   // 3. 请求体解析
    'LoggerMiddleware',    // 4. 日志记录
    'AuthMiddleware'       // 5. 认证
  ],
  
  // 中间件配置
  config: {
    LoggerMiddleware: {
      enabled: true,
      logBody: false,
      ignorePaths: ['/health']
    },
    AuthMiddleware: {
      enabled: true,
      secret: 'your-secret',
      ignorePaths: ['/api/auth/login', '/api/auth/register']
    }
  }
};
```

### 条件启用

```typescript
export default {
  list: ['AuthMiddleware'],
  config: {
    AuthMiddleware: {
      enabled: process.env.NODE_ENV === 'production',  // 仅生产环境启用
      secret: process.env.JWT_SECRET
    }
  }
};
```

## 协议特定中间件

### 绑定到特定协议

```typescript
import { Middleware } from 'koatty';

// 仅在 HTTP/HTTPS 中执行
@Middleware({ protocol: ['http', 'https'] })
export class HttpOnlyMiddleware {
  run(options: any, app: App) {
    return async (ctx: any, next: any) => {
      console.log('HTTP request:', ctx.url);
      await next();
    };
  }
}

// 仅在 gRPC 中执行
@Middleware({ protocol: ['grpc'] })
export class GrpcOnlyMiddleware {
  run(options: any, app: App) {
    return async (ctx: any, next: any) => {
      console.log('gRPC call:', ctx.path);
      await next();
    };
  }
}

// 在多个协议中执行
@Middleware({ protocol: ['http', 'grpc', 'ws'] })
export class MultiProtocolMiddleware {
  run(options: any, app: App) {
    return async (ctx: any, next: any) => {
      // 根据协议类型执行不同逻辑
      switch (ctx.protocol) {
        case 'grpc':
          // gRPC 特定逻辑
          break;
        case 'websocket':
          // WebSocket 特定逻辑
          break;
        default:
          // HTTP 逻辑
      }
      await next();
    };
  }
}

// 所有协议（默认行为）
@Middleware()
export class UniversalMiddleware {
  run(options: any, app: App) {
    return async (ctx: any, next: any) => {
      await next();
    };
  }
}
```

## 路由中间件

### 控制器级别

```typescript
import { Controller, withMiddleware } from 'koatty';
import { AuthMiddleware, RoleMiddleware } from '../middleware';

@Controller('/api/admin', [
  AuthMiddleware,  // 所有方法都需要认证
  RoleMiddleware   // 所有方法都需要角色检查
])
export class AdminController {
  // 所有方法都会应用这些中间件
}
```

### 方法级别

```typescript
import { Controller, GetMapping, PostMapping, withMiddleware } from 'koatty';

@Controller('/api/users')
export class UserController {
  // 公开接口，无需认证
  @GetMapping('/public')
  async publicEndpoint() { }
  
  // 需要认证
  @GetMapping('/profile', {
    middleware: [AuthMiddleware]
  })
  async getProfile() { }
  
  // 需要认证和限流
  @PostMapping('/create', {
    middleware: [
      withMiddleware(AuthMiddleware, { priority: 100 }),
      withMiddleware(RateLimitMiddleware, { 
        priority: 90,
        metadata: { limit: 100, window: 60000 }
      })
    ]
  })
  async createUser() { }
}
```

### 禁用中间件

```typescript
@Controller('/api/users', [
  AuthMiddleware,
  withMiddleware(RateLimitMiddleware, { enabled: false })  // 禁用
])
export class UserController {
  @PostMapping('/login', [
    withMiddleware(AuthMiddleware, { enabled: false })  // 方法级别禁用
  ])
  async login() { }
}
```

## 常用中间件示例

### 1. 跨域中间件 (CORS)

```typescript
import { Middleware } from 'koatty';

@Middleware()
export class CorsMiddleware {
  run(options: any, app: App) {
    const config = {
      origin: options?.origin || '*',
      methods: options?.methods || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: options?.allowedHeaders || ['Content-Type', 'Authorization'],
      credentials: options?.credentials ?? true
    };
    
    return async (ctx: any, next: any) => {
      ctx.set('Access-Control-Allow-Origin', config.origin);
      ctx.set('Access-Control-Allow-Methods', config.methods.join(','));
      ctx.set('Access-Control-Allow-Headers', config.allowedHeaders.join(','));
      ctx.set('Access-Control-Allow-Credentials', config.credentials.toString());
      
      if (ctx.method === 'OPTIONS') {
        ctx.status = 204;
        return;
      }
      
      await next();
    };
  }
}
```

### 2. 认证中间件 (JWT)

```typescript
import { Middleware } from 'koatty';

@Middleware()
export class AuthMiddleware {
  run(options: any, app: App) {
    const config = {
      secret: options?.secret || 'secret',
      ignorePaths: options?.ignorePaths || [],
      enabled: options?.enabled ?? true
    };
    
    return async (ctx: any, next: any) => {
      if (!config.enabled) return await next();
      
      if (config.ignorePaths.some(path => ctx.path.includes(path))) {
        return await next();
      }
      
      const authHeader = ctx.get('authorization');
      if (!authHeader) {
        ctx.status = 401;
        ctx.body = { code: 401, message: 'Unauthorized' };
        return;
      }
      
      const token = authHeader.replace('Bearer ', '');
      
      try {
        // 验证 JWT
        // const decoded = jwt.verify(token, config.secret);
        // ctx.user = decoded;
        
        // 模拟验证
        ctx.user = { id: 1, username: 'demo' };
        
        await next();
      } catch (error) {
        ctx.status = 401;
        ctx.body = { code: 401, message: 'Invalid token' };
      }
    };
  }
}
```

### 3. 限流中间件 (Rate Limit)

```typescript
import { Middleware } from 'koatty';

@Middleware()
export class RateLimitMiddleware {
  private requests = new Map<string, number[]>();
  
  run(options: any, app: App) {
    const config = {
      limit: options?.metadata?.limit || 100,
      window: options?.metadata?.window || 60000  // 1分钟
    };
    
    return async (ctx: any, next: any) => {
      const key = ctx.ip;
      const now = Date.now();
      
      // 获取该 IP 的请求记录
      let timestamps = this.requests.get(key) || [];
      
      // 清理过期的记录
      timestamps = timestamps.filter(t => now - t < config.window);
      
      // 检查是否超过限制
      if (timestamps.length >= config.limit) {
        ctx.status = 429;
        ctx.body = { code: 429, message: 'Too many requests' };
        return;
      }
      
      // 记录本次请求
      timestamps.push(now);
      this.requests.set(key, timestamps);
      
      await next();
    };
  }
}
```

### 4. 错误处理中间件

```typescript
import { Middleware } from 'koatty';

@Middleware()
export class ErrorHandlerMiddleware {
  run(options: any, app: App) {
    return async (ctx: any, next: any) => {
      try {
        await next();
      } catch (error: any) {
        console.error('Error:', error);
        
        ctx.status = error.status || 500;
        ctx.body = {
          code: error.code || 500,
          message: error.message || 'Internal Server Error',
          data: null
        };
      }
    };
  }
}
```

### 5. 请求 ID 中间件

```typescript
import { Middleware } from 'koatty';
import { v4 as uuidv4 } from 'uuid';

@Middleware()
export class RequestIdMiddleware {
  run(options: any, app: App) {
    return async (ctx: any, next: any) => {
      // 从请求头获取或生成新的
      const requestId = ctx.get('x-request-id') || uuidv4();
      
      // 设置到上下文
      ctx.requestId = requestId;
      
      // 设置响应头
      ctx.set('x-request-id', requestId);
      
      await next();
    };
  }
}
```

## 最佳实践

### 1. 中间件职责单一

```typescript
// ✅ 好的做法：每个中间件只做一件事
@Middleware()
export class AuthMiddleware { /* 只处理认证 */ }

@Middleware()
export class LoggerMiddleware { /* 只处理日志 */ }

@Middleware()
export class CorsMiddleware { /* 只处理跨域 */ }

// ❌ 避免：一个中间件做太多事
@Middleware()
export class GodMiddleware {
  run() {
    return async (ctx, next) => {
      // 认证
      // 日志
      // 限流
      // 跨域
      // ... 太多了！
    };
  }
}
```

### 2. 正确处理错误

```typescript
@Middleware()
export class GoodMiddleware {
  run() {
    return async (ctx, next) => {
      try {
        await next();
      } catch (error) {
        // 记录错误
        console.error('Middleware error:', error);
        
        // 继续抛出，让错误处理中间件处理
        throw error;
      }
    };
  }
}
```

### 3. 使用配置而不是硬编码

```typescript
@Middleware()
export class ConfigurableMiddleware {
  run(options: any, app: App) {
    // ✅ 从配置读取
    const timeout = options?.timeout || 5000;
    const retries = options?.retries || 3;
    
    // ❌ 避免硬编码
    // const timeout = 5000;
    
    return async (ctx, next) => {
      // 使用配置
    };
  }
}
```

### 4. 注意异步处理

```typescript
@Middleware()
export class AsyncMiddleware {
  run() {
    return async (ctx, next) => {
      // ✅ 使用 await
      await someAsyncOperation();
      await next();
      await anotherAsyncOperation();
      
      // ❌ 不要忘记 await
      // someAsyncOperation();  // 错误！
    };
  }
}
```
