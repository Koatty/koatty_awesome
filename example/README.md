# Koatty 示例项目

这是一个完整的 Koatty 框架示例项目，展示了 Koatty 的各种功能和最佳实践。

## 项目介绍

Koatty 是一个基于 Koa + TypeScript + IOC 的渐进式 Node.js 框架，用于构建高效、可扩展的服务端应用程序。

### 特性

- 🚄 **高性能**: 基于 Koa 构建，优化的架构设计
- 🧩 **功能完善**: 支持 gRPC、HTTP、WebSocket、GraphQL、定时任务等
- 🧠 **TypeScript 优先**: 原生 TypeScript 支持，优雅的面向对象设计
- 🌀 **类 Spring IOC 容器**: 强大的依赖注入系统，支持自动装配
- ✂️ **AOP 支持**: 面向切面编程，基于装饰器的拦截器
- 🔌 **可扩展架构**: 插件系统，支持依赖注入

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

服务器将启动在：
- HTTP: http://127.0.0.1:3000
- gRPC: 127.0.0.1:50051
- WebSocket: ws://127.0.0.1:3001

### 3. 测试 API

```bash
# 首页
curl http://localhost:3000/

# 健康检查
curl http://localhost:3000/health

# 获取用户列表
curl http://localhost:3000/api/users

# 创建用户
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","age":25}'

# 获取单个用户
curl http://localhost:3000/api/users/1

# 更新用户
curl -X PUT http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{"age":26}'

# 删除用户
curl -X DELETE http://localhost:3000/api/users/1
```

## 项目结构

```
src/
├── config/              # 配置文件
│   ├── config.ts       # 通用配置
│   ├── server.ts       # 服务器配置
│   ├── router.ts       # 路由配置
│   ├── middleware.ts   # 中间件配置
│   ├── db.ts           # 数据库配置
│   └── plugin.ts       # 插件配置
├── controller/          # 控制器
│   ├── UserController.ts      # HTTP 控制器示例
│   ├── HelloGrpcController.ts # gRPC 控制器示例
│   └── ChatWsController.ts    # WebSocket 控制器示例
├── service/             # 服务层
│   └── UserService.ts   # 用户服务示例
├── middleware/          # 中间件
│   ├── LoggerMiddleware.ts # 日志中间件
│   └── AuthMiddleware.ts   # 认证中间件
├── dto/                 # 数据传输对象
│   └── UserDto.ts       # 用户 DTO
├── aspect/              # AOP 切面（可选）
├── model/               # 数据模型（可选）
├── plugin/              # 插件（可选）
├── utils/               # 工具函数
├── App.ts              # 应用入口
└── ...
resource/
└── proto/
    └── hello.proto     # gRPC 协议文件
```

## 功能示例

### 1. HTTP RESTful API

查看 `src/controller/UserController.ts` 了解完整的 RESTful API 实现，包括：

- 路由映射
- 参数绑定（Query、Path、Body）
- 依赖注入（Service）
- 数据验证（DTO）
- 错误处理

### 2. gRPC 服务

查看 `src/controller/HelloGrpcController.ts` 了解 gRPC 实现，支持：

- 简单调用（Unary）
- 服务器流（Server Streaming）
- 客户端流（Client Streaming）
- 双向流（Bidirectional Streaming）

### 3. WebSocket 实时通信

查看 `src/controller/ChatWsController.ts` 了解 WebSocket 实现，包括：

- 连接管理
- 消息广播
- 心跳检测
- 在线用户统计

### 4. 中间件

查看 `src/middleware/` 目录了解中间件实现：

- 日志记录
- 认证授权
- 跨域处理
- 请求体解析

### 5. 服务层

查看 `src/service/UserService.ts` 了解服务层实现：

- 业务逻辑封装
- 缓存注解（@Cacheable, @CacheEvict）
- 依赖注入

## 配置说明

### 服务器配置 (config/server.ts)

```typescript
export default {
  hostname: '127.0.0.1',
  port: [3000, 50051, 3001],      // 多端口
  protocol: ['http', 'grpc', 'ws'], // 多协议
  trace: false,
  ssl: {
    mode: 'auto',
    key: '',
    cert: ''
  }
};
```

### 路由配置 (config/router.ts)

```typescript
export default {
  prefix: '/api',
  payload: {
    limit: '20mb',
    multipart: true
  },
  ext: {
    grpc: {
      protoFile: './resource/proto/hello.proto',
      poolSize: 10
    },
    ws: {
      maxConnections: 1000,
      heartbeatInterval: 15000
    }
  }
};
```

## 开发指南

### 创建控制器

```bash
# HTTP 控制器
kt controller user

# gRPC 控制器
kt controller -t grpc hello

# WebSocket 控制器
kt controller -t ws chat
```

### 创建服务

```bash
kt service user
```

### 创建中间件

```bash
kt middleware auth
```

### 创建 DTO

```bash
kt dto user
```

## 调试

项目已配置 VSCode 调试配置，按 F5 即可启动调试模式。

## 测试

```bash
# 运行测试
npm test

# 运行测试并监听
npm run test:watch
```

## 生产部署

```bash
# 构建
npm run build

# 启动生产服务器
npm start
```

## 文档

- [控制器教程](./docs/controller.md)
- [服务层教程](./docs/service.md)
- [中间件教程](./docs/middleware.md)
- [配置教程](./docs/config.md)
- [gRPC 教程](./docs/grpc.md)
- [WebSocket 教程](./docs/websocket.md)

## 相关链接

- [Koatty 官方文档](https://github.com/Koatty/koatty_doc)
- [Koatty GitHub](https://github.com/Koatty/koatty)
- [Koatty CLI](https://github.com/Koatty/koatty_cli)

## 许可证

MIT
