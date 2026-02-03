# 配置教程

Koatty 使用配置文件来管理应用的各种设置，支持多环境、动态加载和占位符替换。

## 目录

- [配置文件结构](#配置文件结构)
- [配置加载规则](#配置加载规则)
- [读取配置](#读取配置)
- [环境配置](#环境配置)
- [占位符变量](#占位符变量)
- [命令行参数](#命令行参数)

## 配置文件结构

### 标准配置文件

```
src/config/
├── config.ts       # 通用配置（日志、应用基础设置）
├── server.ts       # 服务器配置（协议、端口、SSL）
├── router.ts       # 路由配置（前缀、载荷解析）
├── middleware.ts   # 中间件配置
├── db.ts           # 数据库配置
└── plugin.ts       # 插件配置
```

### 自定义配置

可以创建任意名称的配置文件：

```typescript
// src/config/redis.ts
export default {
  host: '127.0.0.1',
  port: 6379,
  password: '',
  db: 0
};
```

## 配置加载规则

### 配置分类

Koatty 按照文件名对配置进行分类：

| 文件名 | 分类名 | 读取方式 |
|--------|--------|----------|
| `config.ts` | `config` (默认) | `app.config('key')` |
| `server.ts` | `server` | `app.config('key', 'server')` |
| `router.ts` | `router` | `app.config('key', 'router')` |
| `db.ts` | `db` | `app.config('key', 'db')` |
| `redis.ts` | `redis` | `app.config('key', 'redis')` |

### 配置层级

支持多级配置访问：

```typescript
// config.ts
export default {
  database: {
    host: '127.0.0.1',
    port: 3306
  }
};

// 读取层级配置
const host = app.config('database.host');  // '127.0.0.1'
const port = app.config('database.port');  // 3306
```

> ⚠️ 注意：层级配置仅支持直接访问到二级，更深层级需要赋值后再次获取。

## 读取配置

### 方式一：使用 app.config()

```typescript
// 在控制器中
@Controller('/api')
export class MyController {
  app: App;
  
  @GetMapping('/config')
  getConfig() {
    // 读取默认配置 (config.ts)
    const appName = this.app.config('appName');
    
    // 读取服务器配置 (server.ts)
    const port = this.app.config('port', 'server');
    
    // 读取层级配置
    const dbHost = this.app.config('database.host', 'db');
    
    return { appName, port, dbHost };
  }
}
```

### 方式二：使用 @Config 装饰器（推荐）

```typescript
import { Controller, GetMapping, Config } from 'koatty';

@Controller('/api')
export class MyController {
  // 读取默认配置
  @Config('appName')
  appName: string;
  
  // 读取服务器配置
  @Config('port', 'server')
  port: number;
  
  // 读取层级配置
  @Config('database.host', 'db')
  dbHost: string;
  
  @GetMapping('/info')
  getInfo() {
    return {
      name: this.appName,
      port: this.port,
      dbHost: this.dbHost
    };
  }
}
```

### 方式三：在服务层中使用

```typescript
import { Service, Config } from 'koatty';

@Service()
export class UserService {
  app: App;
  
  @Config('jwt.secret')
  jwtSecret: string;
  
  @Config('database.host', 'db')
  dbHost: string;
  
  async validateToken(token: string) {
    // 使用配置
    // jwt.verify(token, this.jwtSecret);
  }
}
```

## 环境配置

### 环境变量优先级

| 变量 | 取值 | 优先级 | 说明 |
|------|------|--------|------|
| `appDebug` | `true/false` | 高 | 调试模式 |
| `KOATTY_ENV` | `development/production` | 中 | 框架环境变量 |
| `NODE_ENV` | `development/production` | 低 | Node.js 环境变量 |

### 环境配置文件

根据环境自动加载不同的配置文件：

```
src/config/
├── config.ts              # 基础配置（始终加载）
├── config_dev.ts          # 开发环境配置
├── config_production.ts   # 生产环境配置
├── server.ts
├── server_dev.ts
└── server_production.ts
```

### 配置合并规则

1. 先加载基础配置（如 `config.ts`）
2. 根据环境加载环境配置（如 `config_dev.ts`）
3. 环境配置会覆盖基础配置的相同键

```typescript
// config.ts
export default {
  appName: 'MyApp',
  debug: false,
  logLevel: 'info'
};

// config_dev.ts
export default {
  debug: true,        // 覆盖
  logLevel: 'debug'   // 覆盖
};

// 最终配置（开发环境）
{
  appName: 'MyApp',   // 来自基础配置
  debug: true,        // 来自 dev 配置
  logLevel: 'debug'   // 来自 dev 配置
}
```

### 设置运行环境

```bash
# 方式1：使用 NODE_ENV
NODE_ENV=development npm run dev
NODE_ENV=production npm start

# 方式2：使用 KOATTY_ENV
KOATTY_ENV=development npm run dev

# 方式3：在 App.ts 中设置
export class App extends Koatty {
  public init() {
    this.appDebug = true;  // 强制开发模式
  }
}
```

## 占位符变量

### 使用 ${} 占位符

配置文件支持使用 `${variable}` 占位符，会被自动替换为环境变量值：

```typescript
// config.ts
export default {
  // 使用环境变量
  databasePassword: '${DB_PASSWORD}',
  
  // 使用 Koatty 内置变量
  logPath: '${LOGS_PATH}',
  appPath: '${APP_PATH}',
  rootPath: '${ROOT_PATH}'
};
```

### 内置环境变量

| 变量 | 说明 | 示例值 |
|------|------|--------|
| `ROOT_PATH` | 项目根目录 | `/path/to/project` |
| `APP_PATH` | 应用目录 | `/path/to/project/src` (dev) 或 `/path/to/project/dist` (prod) |
| `KOATTY_PATH` | 框架目录 | `/path/to/project/node_modules/koatty` |
| `LOGS_PATH` | 日志目录 | `/path/to/project/logs` |

### 使用示例

```bash
# 启动时传入环境变量
DB_PASSWORD=secret123 npm run dev
```

```typescript
// 配置文件中
export default {
  database: {
    password: '${DB_PASSWORD}'  // 会被替换为 'secret123'
  }
};
```

## 命令行参数

### 自动填充配置

命令行参数会自动填充到配置中：

```bash
# 设置 config.port 的值
npm run dev -- --port=8080

# 设置嵌套配置
npm run dev -- --database.host=192.168.1.100

# 多个参数
npm run dev -- --port=8080 --debug=true
```

### 参数优先级

命令行参数优先级最高，会覆盖配置文件中的值：

```
命令行参数 > 环境配置 > 基础配置
```

## 配置示例

### 完整的服务器配置

```typescript
// config/server.ts
export default {
  hostname: '127.0.0.1',
  
  // 单端口
  port: 3000,
  protocol: 'http',
  
  // 或者多端口多协议
  // port: [3000, 50051, 3001],
  // protocol: ['http', 'grpc', 'ws'],
  
  trace: false,
  
  ssl: {
    mode: 'auto',  // 'auto' | 'manual' | 'mutual_tls'
    key: '${SSL_KEY_PATH}',
    cert: '${SSL_CERT_PATH}',
    ca: '${SSL_CA_PATH}'
  }
};
```

### 完整的数据库配置

```typescript
// config/db.ts
export default {
  type: 'mysql',
  host: '${DB_HOST}',
  port: parseInt('${DB_PORT}') || 3306,
  database: '${DB_NAME}',
  username: '${DB_USER}',
  password: '${DB_PASSWORD}',
  
  pool: {
    min: 2,
    max: 10
  },
  
  logging: process.env.NODE_ENV === 'development',
  synchronize: false
};
```

### 环境特定配置

```typescript
// config/config_dev.ts
export default {
  logger: {
    level: 'debug',
    console: true
  },
  cors: {
    origin: '*'
  }
};

// config/config_production.ts
export default {
  logger: {
    level: 'warn',
    console: false,
    file: true
  },
  cors: {
    origin: 'https://example.com'
  }
};
```

## 最佳实践

### 1. 敏感信息使用环境变量

```typescript
// ✅ 好的做法
export default {
  database: {
    password: '${DB_PASSWORD}'
  },
  jwt: {
    secret: '${JWT_SECRET}'
  }
};

// ❌ 避免硬编码敏感信息
export default {
  database: {
    password: '123456'  // 不要这样做！
  }
};
```

### 2. 使用 TypeScript 类型

```typescript
// 定义配置类型
interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
}

// config/db.ts
const config: DatabaseConfig = {
  host: '127.0.0.1',
  port: 3306,
  username: 'root',
  password: '${DB_PASSWORD}'
};

export default config;
```

### 3. 提供默认值

```typescript
export default {
  // 使用逻辑或提供默认值
  port: parseInt(process.env.PORT || '') || 3000,
  
  // 使用 nullish 合并
  timeout: process.env.TIMEOUT ?? 5000
};
```

### 4. 配置验证

```typescript
// config/validate.ts
export function validateConfig(config: any) {
  const required = ['database.host', 'database.password'];
  
  for (const key of required) {
    const value = key.split('.').reduce((obj, k) => obj?.[k], config);
    if (!value) {
      throw new Error(`Missing required config: ${key}`);
    }
  }
}
```

### 5. 文档化配置

```typescript
/**
 * 服务器配置
 * 
 * @property hostname - 服务器主机名
 * @property port - 服务器端口，支持单端口或多端口
 * @property protocol - 协议类型: http, https, grpc, ws
 * @property ssl - SSL 配置
 */
export default {
  hostname: '127.0.0.1',
  port: 3000,
  protocol: 'http',
  ssl: {
    mode: 'auto'
  }
};
```
