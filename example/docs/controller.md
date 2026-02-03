# 控制器教程

控制器（Controller）是 Koatty 中处理 HTTP/gRPC/WebSocket 请求的核心组件。

## 目录

- [HTTP 控制器](#http-控制器)
- [gRPC 控制器](#grpc-控制器)
- [WebSocket 控制器](#websocket-控制器)
- [参数绑定](#参数绑定)
- [依赖注入](#依赖注入)
- [路由中间件](#路由中间件)

## HTTP 控制器

### 基本结构

```typescript
import { Controller, GetMapping } from 'koatty';
import { App } from '../App';

@Controller('/api')  // 路由前缀
export class UserController {
  app: App;
  ctx: any;
  
  constructor(ctx: any) {
    this.ctx = ctx;  // 必须赋值
  }
  
  @GetMapping('/users')  // GET /api/users
  async getUsers() {
    return { code: 200, data: [] };
  }
}
```

### 路由装饰器

| 装饰器 | HTTP 方法 | 示例 |
|--------|----------|------|
| `@GetMapping` | GET | `@GetMapping('/users')` |
| `@PostMapping` | POST | `@PostMapping('/users')` |
| `@PutMapping` | PUT | `@PutMapping('/users/:id')` |
| `@DeleteMapping` | DELETE | `@DeleteMapping('/users/:id')` |
| `@PatchMapping` | PATCH | `@PatchMapping('/users/:id')` |
| `@RequestMapping` | 任意 | `@RequestMapping('/users', { method: ['GET', 'POST'] })` |

## gRPC 控制器

### 基本结构

```typescript
import { GrpcController, PostMapping } from 'koatty';

@GrpcController('/Hello')  // 必须与 proto service 名一致
export class HelloController {
  app: App;
  ctx: any;
  
  constructor(ctx: any) {
    this.ctx = ctx;
  }
  
  @PostMapping('/SayHello')  // 必须与 proto 方法名一致
  async sayHello(@RequestBody() request: any) {
    return { message: `Hello, ${request.name}!` };
  }
}
```

### Proto 文件

```protobuf
syntax = "proto3";

service Hello {
  rpc SayHello (HelloRequest) returns (HelloReply);
}

message HelloRequest {
  string name = 1;
}

message HelloReply {
  string message = 1;
}
```

### 流处理

```typescript
// 服务器流
@PostMapping('/StreamData')
async streamData() {
  for (let i = 0; i < 10; i++) {
    this.ctx.writeStream({ data: i });
    await this.delay(100);
  }
  this.ctx.endStream();
}

// 客户端流
@PostMapping('/ReceiveStream')
async receiveStream() {
  if (this.ctx.streamMessage) {
    // 处理客户端发送的消息
  }
}

// 双向流
@PostMapping('/Chat')
async chat() {
  if (this.ctx.streamMessage) {
    this.ctx.writeStream({ echo: this.ctx.streamMessage });
  }
}
```

## WebSocket 控制器

### 基本结构

```typescript
import { WsController, GetMapping } from 'koatty';

@WsController('/ws')
export class ChatController {
  app: App;
  ctx: any;
  
  constructor(ctx: any) {
    this.ctx = ctx;
  }
  
  // 连接建立时触发
  async onConnection() {
    console.log('Client connected');
  }
  
  // 处理消息
  @GetMapping('/')
  async handleMessage(@RequestBody() message: any) {
    return { type: 'response', data: message };
  }
  
  // 连接断开时触发
  async onDisconnection() {
    console.log('Client disconnected');
  }
}
```

## 参数绑定

### Query 参数

```typescript
@GetMapping('/users')
async getUsers(
  @QueryParam('page') page: number = 1,
  @QueryParam('limit') limit: number = 10
) {
  // GET /users?page=1&limit=10
}
```

### Path 参数

```typescript
@GetMapping('/users/:id')
async getUser(@PathVariable('id') id: number) {
  // GET /users/123
}
```

### Body 参数

```typescript
@PostMapping('/users')
async createUser(@RequestBody() data: CreateUserDto) {
  // POST /users
  // Body: { "username": "test", "email": "test@example.com" }
}
```

### Header 参数

```typescript
@GetMapping('/profile')
async getProfile(@Header('authorization') token: string) {
  // 获取请求头
}
```

## 依赖注入

### 注入 Service

```typescript
import { Autowired } from 'koatty';

@Controller('/api/users')
export class UserController {
  @Autowired()
  userService: UserService;
  
  @GetMapping('/')
  async getUsers() {
    return await this.userService.findAll();
  }
}
```

### 注入 Logger

```typescript
import { Logger } from 'koatty';

@Controller('/api')
export class MyController {
  @Logger()
  logger: any;
  
  @GetMapping('/')
  async index() {
    this.logger.info('Access index');
    return { message: 'OK' };
  }
}
```

### 注入配置

```typescript
import { Config } from 'koatty';

@Controller('/api')
export class MyController {
  @Config('jwt.secret')
  jwtSecret: string;
  
  @Config('appName')
  appName: string;
}
```

## 路由中间件

### 控制器级别

```typescript
import { withMiddleware } from 'koatty';

@Controller('/api/admin', [
  AuthMiddleware,
  withMiddleware(RoleMiddleware, { metadata: { role: 'admin' } })
])
export class AdminController {
  // 所有方法都会执行这些中间件
}
```

### 方法级别

```typescript
@Controller('/api/users')
export class UserController {
  @GetMapping('/public')
  async publicEndpoint() {
    // 无需认证
  }
  
  @GetMapping('/private', {
    middleware: [AuthMiddleware]
  })
  async privateEndpoint() {
    // 需要认证
  }
  
  @PostMapping('/admin', {
    middleware: [
      withMiddleware(AuthMiddleware, { priority: 100 }),
      withMiddleware(AdminMiddleware, { priority: 90 })
    ]
  })
  async adminAction() {
    // 需要管理员权限
  }
}
```

## 响应处理

### 标准响应

```typescript
@GetMapping('/')
async index() {
  return {
    code: 200,
    message: 'Success',
    data: { ... }
  };
}
```

### 设置状态码

```typescript
@PostMapping('/users')
async createUser() {
  this.ctx.status = 201;  // Created
  return { code: 201, message: 'Created' };
}
```

### 错误处理

```typescript
@GetMapping('/users/:id')
async getUser(@PathVariable('id') id: number) {
  const user = await this.userService.findById(id);
  
  if (!user) {
    this.ctx.status = 404;
    return { code: 404, message: 'User not found' };
  }
  
  return { code: 200, data: user };
}
```

## 最佳实践

1. **单一职责**: 每个控制器只处理一种资源
2. **依赖注入**: 使用 `@Autowired` 注入 Service，不要直接实例化
3. **DTO 验证**: 使用 `@Validated()` 和 DTO 类进行参数验证
4. **错误处理**: 统一错误响应格式
5. **日志记录**: 使用 `@Logger()` 注入日志器记录关键操作
