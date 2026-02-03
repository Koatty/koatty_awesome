# gRPC 教程

Koatty 提供了完整的 gRPC 支持，包括四种流类型和自动代码生成。

## 目录

- [基本概念](#基本概念)
- [Proto 文件定义](#proto-文件定义)
- [创建 gRPC 控制器](#创建-grpc-控制器)
- [四种流类型](#四种流类型)
- [配置 gRPC](#配置-grpc)
- [客户端调用](#客户端调用)

## 基本概念

### gRPC 是什么？

gRPC 是 Google 开源的高性能 RPC 框架，基于 Protocol Buffers 和 HTTP/2：

- **高性能**: 基于 HTTP/2 和 Protocol Buffers
- **跨语言**: 支持多种编程语言
- **强类型**: 使用 Protocol Buffers 定义接口
- **流支持**: 支持双向流通信

### Koatty 的 gRPC 支持

- 自动服务注册和发现
- 支持四种流类型
- 与 HTTP 服务共存
- 自动 proto 文件加载

## Proto 文件定义

### 基本结构

```protobuf
syntax = "proto3";

package hello;

// 定义服务
service Hello {
  // 定义方法
  rpc SayHello (HelloRequest) returns (HelloReply);
}

// 请求消息
message HelloRequest {
  string name = 1;
  int32 age = 2;
}

// 响应消息
message HelloReply {
  string message = 1;
  int64 timestamp = 2;
}
```

### 字段编号

每个字段都需要一个唯一的编号（1-536,870,911）：

```protobuf
message User {
  int32 id = 1;           // 字段编号 1
  string name = 2;        // 字段编号 2
  string email = 3;       // 字段编号 3
  
  // 保留编号，防止重复使用
  reserved 4, 5, 6;
  reserved "foo", "bar";
}
```

### 数据类型

| Proto 类型 | TypeScript 类型 | 说明 |
|------------|----------------|------|
| `double` | `number` | 双精度浮点数 |
| `float` | `number` | 单精度浮点数 |
| `int32` | `number` | 32位整数 |
| `int64` | `number` | 64位整数 |
| `uint32` | `number` | 无符号32位整数 |
| `bool` | `boolean` | 布尔值 |
| `string` | `string` | 字符串 |
| `bytes` | `Buffer` | 字节数组 |
| `enum` | `enum` | 枚举 |
| `message` | `interface/class` | 嵌套消息 |

### 复杂类型示例

```protobuf
syntax = "proto3";

package user;

// 枚举类型
enum UserStatus {
  UNKNOWN = 0;
  ACTIVE = 1;
  INACTIVE = 2;
  BANNED = 3;
}

// 嵌套消息
message Address {
  string street = 1;
  string city = 2;
  string country = 3;
  string zipCode = 4;
}

// 用户消息
message User {
  int32 id = 1;
  string username = 2;
  string email = 3;
  UserStatus status = 4;
  Address address = 5;
  repeated string tags = 6;  // 数组
  map<string, string> metadata = 7;  // Map
}

// 列表请求
message ListUsersRequest {
  int32 page = 1;
  int32 limit = 2;
}

// 列表响应
message ListUsersResponse {
  repeated User users = 1;
  int32 total = 2;
}

// 用户服务
service UserService {
  rpc GetUser (GetUserRequest) returns (User);
  rpc ListUsers (ListUsersRequest) returns (ListUsersResponse);
  rpc CreateUser (CreateUserRequest) returns (User);
  rpc UpdateUser (UpdateUserRequest) returns (User);
  rpc DeleteUser (DeleteUserRequest) returns (DeleteUserResponse);
}
```

## 创建 gRPC 控制器

### 基本结构

```typescript
import { GrpcController, PostMapping, RequestBody } from 'koatty';
import { App } from '../App';

@GrpcController('/Hello')  // 必须与 proto service 名一致
export class HelloController {
  app: App;
  ctx: any;
  
  constructor(ctx: any) {
    this.ctx = ctx;
  }
  
  @PostMapping('/SayHello')  // 必须与 proto 方法名一致
  async sayHello(@RequestBody() request: any): Promise<any> {
    return {
      message: `Hello, ${request.name}!`,
      timestamp: Date.now()
    };
  }
}
```

### 使用 DTO

```typescript
import { IsString, IsInt, IsOptional } from 'class-validator';

// 请求 DTO
export class HelloRequestDto {
  @IsString()
  name: string;
  
  @IsOptional()
  @IsInt()
  age?: number;
}

// 响应 DTO
export class HelloReplyDto {
  message: string;
  timestamp: number;
}
```

```typescript
import { GrpcController, PostMapping, RequestBody, Validated } from 'koatty';

@GrpcController('/Hello')
export class HelloController {
  app: App;
  ctx: any;
  
  constructor(ctx: any) {
    this.ctx = ctx;
  }
  
  @PostMapping('/SayHello')
  @Validated()  // 启用参数验证
  async sayHello(
    @RequestBody() request: HelloRequestDto
  ): Promise<HelloReplyDto> {
    const message = request.age 
      ? `Hello, ${request.name}! You are ${request.age} years old.`
      : `Hello, ${request.name}!`;
    
    return {
      message,
      timestamp: Date.now()
    };
  }
}
```

## 四种流类型

### 1. 简单调用 (Unary)

客户端发送一个请求，服务器返回一个响应。

```protobuf
rpc SayHello (HelloRequest) returns (HelloReply);
```

```typescript
@GrpcController('/Hello')
export class HelloController {
  @PostMapping('/SayHello')
  async sayHello(@RequestBody() request: any): Promise<any> {
    // 处理请求
    return {
      message: `Hello, ${request.name}!`,
      timestamp: Date.now()
    };
  }
}
```

### 2. 服务器流 (Server Streaming)

客户端发送一个请求，服务器返回多个响应。

```protobuf
rpc StreamData (StreamRequest) returns (stream StreamResponse);
```

```typescript
@GrpcController('/Data')
export class DataController {
  @PostMapping('/StreamData')
  async streamData(@RequestBody() request: any): Promise<void> {
    // 发送多条消息
    for (let i = 0; i < 10; i++) {
      this.ctx.writeStream({
        data: `Message ${i}`,
        timestamp: Date.now()
      });
      
      // 模拟延迟
      await this.delay(500);
    }
    
    // 结束流
    this.ctx.endStream();
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 3. 客户端流 (Client Streaming)

客户端发送多个请求，服务器返回一个响应。

```protobuf
rpc UploadData (stream UploadRequest) returns (UploadResponse);
```

```typescript
@GrpcController('/Upload')
export class UploadController {
  private chunks: any[] = [];
  
  @PostMapping('/UploadData')
  async uploadData(): Promise<any> {
    // 接收客户端发送的消息
    if (this.ctx.streamMessage) {
      this.chunks.push(this.ctx.streamMessage);
      
      // 可以在这里处理每个 chunk
      console.log(`Received chunk: ${this.chunks.length}`);
    }
    
    // 当流结束时，返回汇总结果
    // 注意：实际实现可能需要其他方式检测流结束
    return {
      totalChunks: this.chunks.length,
      status: 'success'
    };
  }
}
```

### 4. 双向流 (Bidirectional Streaming)

客户端和服务器都可以发送多个消息。

```protobuf
rpc Chat (stream ChatMessage) returns (stream ChatMessage);
```

```typescript
@GrpcController('/Chat')
export class ChatController {
  @PostMapping('/Chat')
  async chat(): Promise<void> {
    // 接收客户端消息
    if (this.ctx.streamMessage) {
      const received = this.ctx.streamMessage;
      
      console.log(`Received from ${received.from}: ${received.content}`);
      
      // 回复消息
      this.ctx.writeStream({
        from: 'Server',
        content: `Echo: ${received.content}`,
        timestamp: Date.now()
      });
    }
  }
}
```

## 配置 gRPC

### 服务器配置

```typescript
// config/server.ts
export default {
  hostname: '127.0.0.1',
  port: [3000, 50051],  // HTTP + gRPC
  protocol: ['http', 'grpc'],
  trace: false,
  ssl: {
    mode: 'auto'
  }
};
```

### 路由配置

```typescript
// config/router.ts
export default {
  prefix: '/api',
  
  ext: {
    // gRPC 特定配置
    grpc: {
      // proto 文件路径（必需）
      protoFile: './resource/proto/hello.proto',
      
      // 连接池大小
      poolSize: 10,
      
      // 批处理大小
      batchSize: 10,
      
      // 流配置
      streamConfig: {
        maxConcurrentStreams: 50,    // 最大并发流
        streamTimeout: 60000,        // 流超时时间(ms)
        backpressureThreshold: 2048  // 背压阈值
      },
      
      // 启用反射（用于 grpcurl 等工具调试）
      enableReflection: true
    }
  }
};
```

### 多 proto 文件

```typescript
// config/router.ts
export default {
  ext: {
    grpc: {
      // 多个 proto 文件
      protoFiles: [
        './resource/proto/user.proto',
        './resource/proto/order.proto',
        './resource/proto/product.proto'
      ],
      
      // 或者使用通配符
      // protoFile: './resource/proto/*.proto',
      
      poolSize: 20
    }
  }
};
```

## 客户端调用

### 使用 koatty_client

```typescript
import { GrpcClient } from 'koatty_client';

// 创建客户端
const client = new GrpcClient({
  host: '127.0.0.1',
  port: 50051,
  protoFile: './resource/proto/hello.proto'
});

// 简单调用
async function sayHello() {
  const response = await client.call('Hello', 'SayHello', {
    name: 'World',
    age: 25
  });
  
  console.log(response);  // { message: 'Hello, World!...', timestamp: 123456 }
}

// 服务器流
async function streamData() {
  const stream = client.stream('Data', 'StreamData', { count: 10 });
  
  stream.on('data', (data) => {
    console.log('Received:', data);
  });
  
  stream.on('end', () => {
    console.log('Stream ended');
  });
}

// 客户端流
async function uploadData() {
  const stream = client.clientStream('Upload', 'UploadData');
  
  for (let i = 0; i < 10; i++) {
    stream.write({ chunk: `data-${i}` });
  }
  
  stream.end();
  
  const response = await stream.response();
  console.log(response);
}

// 双向流
async function chat() {
  const stream = client.bidiStream('Chat', 'Chat');
  
  stream.on('data', (data) => {
    console.log('Received:', data);
  });
  
  stream.write({
    from: 'Client',
    content: 'Hello!'
  });
}
```

### 使用 grpcurl 测试

```bash
# 列出服务
grpcurl -plaintext localhost:50051 list

# 列出方法
grpcurl -plaintext localhost:50051 list hello.Hello

# 调用方法
grpcurl -plaintext -d '{"name":"World"}' localhost:50051 hello.Hello/SayHello

# 调用流方法
grpcurl -plaintext -d '{"name":"World"}' localhost:50051 hello.Hello/SayHelloStream
```

## 最佳实践

### 1. 使用 DTO 进行参数验证

```typescript
// 始终使用 DTO 和 @Validated()
@PostMapping('/CreateUser')
@Validated()
async createUser(@RequestBody() request: CreateUserDto): Promise<UserDto> {
  // 参数已经过验证
}
```

### 2. 处理流错误

```typescript
@PostMapping('/StreamData')
async streamData(): Promise<void> {
  try {
    for (let i = 0; i < 100; i++) {
      this.ctx.writeStream({ data: i });
    }
    this.ctx.endStream();
  } catch (error) {
    console.error('Stream error:', error);
    // 确保流被正确关闭
    this.ctx.endStream();
  }
}
```

### 3. 使用日志记录

```typescript
import { Log } from 'koatty_logger';

@GrpcController('/Hello')
export class HelloController {
  @Log()
  logger: any;
  
  @PostMapping('/SayHello')
  async sayHello(@RequestBody() request: any): Promise<any> {
    this.logger.info(`gRPC call: SayHello, name=${request.name}`);
    
    try {
      const result = await this.process(request);
      this.logger.info(`gRPC response: success`);
      return result;
    } catch (error) {
      this.logger.error(`gRPC error:`, error);
      throw error;
    }
  }
}
```

### 4. 版本控制

```protobuf
// 使用包名进行版本控制
package user.v1;

service UserService {
  rpc GetUser (GetUserRequest) returns (User);
}

// v2 版本
package user.v2;

service UserService {
  rpc GetUser (GetUserRequest) returns (User);
  rpc GetUserV2 (GetUserRequest) returns (UserV2);
}
```

### 5. 错误处理

```typescript
import { GrpcStatus } from 'koatty_exception';

@GrpcController('/User')
export class UserController {
  @PostMapping('/GetUser')
  async getUser(@RequestBody() request: any): Promise<any> {
    const user = await this.userService.findById(request.id);
    
    if (!user) {
      // 抛出 gRPC 错误
      const error = new Error('User not found');
      (error as any).code = GrpcStatus.NOT_FOUND;
      throw error;
    }
    
    return user;
  }
}
```
