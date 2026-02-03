# WebSocket 教程

Koatty 提供了完整的 WebSocket 支持，可用于实现实时通信功能。

## 目录

- [基本概念](#基本概念)
- [创建 WebSocket 控制器](#创建-websocket-控制器)
- [连接管理](#连接管理)
- [消息处理](#消息处理)
- [广播机制](#广播机制)
- [心跳检测](#心跳检测)
- [配置 WebSocket](#配置-websocket)
- [客户端连接](#客户端连接)

## 基本概念

### WebSocket 是什么？

WebSocket 是一种在单个 TCP 连接上进行全双工通信的协议：

- **实时性**: 服务器可以主动推送消息
- **双向通信**: 客户端和服务器都可以发送消息
- **低延迟**: 建立连接后无需重复握手
- **节省资源**: 相比轮询更节省带宽

### Koatty 的 WebSocket 支持

- 与 HTTP 服务共存
- 自动连接管理
- 支持广播和单发
- 心跳检测机制
- 连接数限制

## 创建 WebSocket 控制器

### 基本结构

```typescript
import { WsController, GetMapping, RequestBody } from 'koatty';
import { App } from '../App';

@WsController('/ws')
export class ChatController {
  app: App;
  ctx: any;
  
  constructor(ctx: any) {
    this.ctx = ctx;
  }
  
  /**
   * 连接建立时触发
   */
  async onConnection(): Promise<void> {
    console.log('Client connected:', this.ctx.id);
  }
  
  /**
   * 处理消息
   */
  @GetMapping('/')
  async handleMessage(@RequestBody() message: any): Promise<any> {
    console.log('Received:', message);
    
    return {
      type: 'response',
      data: message,
      timestamp: Date.now()
    };
  }
  
  /**
   * 连接断开时触发
   */
  async onDisconnection(): Promise<void> {
    console.log('Client disconnected:', this.ctx.id);
  }
}
```

### 完整聊天室示例

```typescript
import { WsController, GetMapping, RequestBody, Logger } from 'koatty';
import { App } from '../App';

interface ChatMessage {
  type: string;
  content?: any;
  from?: string;
  timestamp?: number;
}

@WsController('/chat')
export class ChatRoomController {
  app: App;
  ctx: any;
  
  @Logger()
  logger: any;
  
  // 存储所有客户端连接
  private static clients: Map<string, any> = new Map();
  
  constructor(ctx: any) {
    this.ctx = ctx;
  }
  
  /**
   * 客户端连接
   */
  async onConnection(): Promise<void> {
    const clientId = this.generateClientId();
    this.ctx.id = clientId;
    
    // 保存连接
    ChatRoomController.clients.set(clientId, this.ctx);
    
    this.logger.info(`Client connected: ${clientId}`);
    this.logger.info(`Total clients: ${ChatRoomController.clients.size}`);
    
    // 发送欢迎消息
    this.sendToClient({
      type: 'welcome',
      content: {
        clientId,
        message: 'Welcome to the chat room!'
      }
    });
    
    // 广播用户加入
    this.broadcast({
      type: 'user_joined',
      content: {
        clientId,
        totalUsers: ChatRoomController.clients.size
      }
    }, clientId);
  }
  
  /**
   * 处理消息
   */
  @GetMapping('/')
  async handleMessage(@RequestBody() message: ChatMessage): Promise<any> {
    const clientId = this.ctx.id;
    
    this.logger.info(`Message from ${clientId}: ${JSON.stringify(message)}`);
    
    switch (message.type) {
      case 'chat':
        // 广播聊天消息
        this.broadcast({
          type: 'chat',
          content: message.content,
          from: clientId,
          timestamp: Date.now()
        });
        return { type: 'sent' };
        
      case 'ping':
        // 心跳响应
        return { type: 'pong', timestamp: Date.now() };
        
      case 'typing':
        // 广播正在输入状态
        this.broadcast({
          type: 'typing',
          from: clientId
        }, clientId);
        return { type: 'sent' };
        
      default:
        return {
          type: 'error',
          content: 'Unknown message type'
        };
    }
  }
  
  /**
   * 客户端断开
   */
  async onDisconnection(): Promise<void> {
    const clientId = this.ctx.id;
    
    ChatRoomController.clients.delete(clientId);
    
    this.logger.info(`Client disconnected: ${clientId}`);
    this.logger.info(`Total clients: ${ChatRoomController.clients.size}`);
    
    // 广播用户离开
    this.broadcast({
      type: 'user_left',
      content: {
        clientId,
        totalUsers: ChatRoomController.clients.size
      }
    });
  }
  
  /**
   * 发送消息给当前客户端
   */
  private sendToClient(message: ChatMessage): void {
    if (this.ctx.websocket) {
      this.ctx.websocket.send(JSON.stringify(message));
    }
  }
  
  /**
   * 广播消息给所有客户端
   */
  private broadcast(message: ChatMessage, excludeId?: string): void {
    const messageStr = JSON.stringify(message);
    
    ChatRoomController.clients.forEach((ctx, id) => {
      if (id !== excludeId && ctx.websocket) {
        try {
          ctx.websocket.send(messageStr);
        } catch (error) {
          this.logger.error(`Failed to send to ${id}:`, error);
        }
      }
    });
  }
  
  /**
   * 生成客户端 ID
   */
  private generateClientId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
```

## 连接管理

### 获取连接信息

```typescript
@WsController('/ws')
export class MyController {
  async onConnection(): Promise<void> {
    // 连接 ID
    console.log('ID:', this.ctx.id);
    
    // 客户端 IP
    console.log('IP:', this.ctx.ip);
    
    // 请求头
    console.log('Headers:', this.ctx.header);
    
    // 查询参数
    console.log('Query:', this.ctx.query);
  }
}
```

### 连接数限制

```typescript
@WsController('/ws')
export class LimitedController {
  private static connections = 0;
  private static readonly MAX_CONNECTIONS = 100;
  
  async onConnection(): Promise<void> {
    if (LimitedController.connections >= LimitedController.MAX_CONNECTIONS) {
      // 拒绝连接
      this.ctx.websocket.close(1008, 'Server is full');
      return;
    }
    
    LimitedController.connections++;
    
    // 发送当前连接数
    this.send({
      type: 'connected',
      connections: LimitedController.connections
    });
  }
  
  async onDisconnection(): Promise<void> {
    LimitedController.connections--;
  }
}
```

## 消息处理

### 消息格式

建议统一消息格式：

```typescript
interface WebSocketMessage {
  type: string;        // 消息类型
  content?: any;       // 消息内容
  from?: string;       // 发送者
  timestamp?: number;  // 时间戳
  id?: string;         // 消息 ID
}
```

### 处理不同类型的消息

```typescript
@WsController('/ws')
export class MessageController {
  @GetMapping('/')
  async handleMessage(@RequestBody() message: any): Promise<any> {
    switch (message.type) {
      case 'subscribe':
        return this.handleSubscribe(message);
        
      case 'unsubscribe':
        return this.handleUnsubscribe(message);
        
      case 'action':
        return this.handleAction(message);
        
      default:
        return {
          type: 'error',
          message: 'Unknown message type'
        };
    }
  }
  
  private handleSubscribe(message: any): any {
    // 处理订阅逻辑
    return { type: 'subscribed' };
  }
  
  private handleUnsubscribe(message: any): any {
    // 处理取消订阅逻辑
    return { type: 'unsubscribed' };
  }
  
  private handleAction(message: any): any {
    // 处理动作逻辑
    return { type: 'action_completed' };
  }
}
```

## 广播机制

### 全局广播

```typescript
@WsController('/ws')
export class BroadcastController {
  private static clients: Map<string, any> = new Map();
  
  async onConnection(): Promise<void> {
    BroadcastController.clients.set(this.ctx.id, this.ctx);
  }
  
  async onDisconnection(): Promise<void> {
    BroadcastController.clients.delete(this.ctx.id);
  }
  
  @GetMapping('/')
  async handleMessage(@RequestBody() message: any): Promise<any> {
    // 广播给所有人
    this.broadcast({
      type: 'message',
      content: message.content,
      from: this.ctx.id
    });
    
    return { type: 'sent' };
  }
  
  private broadcast(message: any): void {
    const messageStr = JSON.stringify(message);
    
    BroadcastController.clients.forEach((ctx) => {
      if (ctx.websocket && ctx.websocket.readyState === 1) {
        ctx.websocket.send(messageStr);
      }
    });
  }
}
```

### 分组广播

```typescript
@WsController('/ws')
export class GroupController {
  // 按房间分组
  private static rooms: Map<string, Set<string>> = new Map();
  private static clients: Map<string, any> = new Map();
  
  @GetMapping('/')
  async handleMessage(@RequestBody() message: any): Promise<any> {
    switch (message.type) {
      case 'join':
        this.joinRoom(message.room);
        return { type: 'joined', room: message.room };
        
      case 'leave':
        this.leaveRoom(message.room);
        return { type: 'left', room: message.room };
        
      case 'room_message':
        this.broadcastToRoom(message.room, {
          type: 'message',
          content: message.content,
          from: this.ctx.id,
          room: message.room
        });
        return { type: 'sent' };
        
      default:
        return { type: 'error', message: 'Unknown type' };
    }
  }
  
  private joinRoom(roomId: string): void {
    if (!GroupController.rooms.has(roomId)) {
      GroupController.rooms.set(roomId, new Set());
    }
    GroupController.rooms.get(roomId)!.add(this.ctx.id);
  }
  
  private leaveRoom(roomId: string): void {
    const room = GroupController.rooms.get(roomId);
    if (room) {
      room.delete(this.ctx.id);
      if (room.size === 0) {
        GroupController.rooms.delete(roomId);
      }
    }
  }
  
  private broadcastToRoom(roomId: string, message: any): void {
    const room = GroupController.rooms.get(roomId);
    if (!room) return;
    
    const messageStr = JSON.stringify(message);
    
    room.forEach(clientId => {
      const ctx = GroupController.clients.get(clientId);
      if (ctx?.websocket?.readyState === 1) {
        ctx.websocket.send(messageStr);
      }
    });
  }
}
```

## 心跳检测

### 服务器端配置

```typescript
// config/router.ts
export default {
  ext: {
    ws: {
      // 心跳检测间隔(ms)
      heartbeatInterval: 15000,
      
      // 心跳超时时间(ms)
      heartbeatTimeout: 30000,
      
      // 最大连接数
      maxConnections: 1000
    }
  }
};
```

### 处理心跳消息

```typescript
@WsController('/ws')
export class HeartbeatController {
  private lastPing: number = Date.now();
  
  @GetMapping('/')
  async handleMessage(@RequestBody() message: any): Promise<any> {
    switch (message.type) {
      case 'ping':
        this.lastPing = Date.now();
        return {
          type: 'pong',
          timestamp: Date.now()
        };
        
      default:
        return this.handleBusinessMessage(message);
    }
  }
  
  async onDisconnection(): Promise<void> {
    // 检查是否是超时断开
    const elapsed = Date.now() - this.lastPing;
    if (elapsed > 30000) {
      console.log('Client disconnected due to timeout');
    }
  }
}
```

## 配置 WebSocket

### 服务器配置

```typescript
// config/server.ts
export default {
  hostname: '127.0.0.1',
  port: [3000, 3001],  // HTTP + WebSocket
  protocol: ['http', 'ws'],
  trace: false
};
```

### 路由配置

```typescript
// config/router.ts
export default {
  prefix: '/api',
  
  ext: {
    ws: {
      // 最大分帧大小(字节)
      maxFrameSize: 1024 * 1024,  // 1MB
      
      // 心跳检测间隔(ms)
      heartbeatInterval: 15000,
      
      // 心跳超时时间(ms)
      heartbeatTimeout: 30000,
      
      // 最大连接数
      maxConnections: 1000,
      
      // 最大缓冲区大小(字节)
      maxBufferSize: 10 * 1024 * 1024  // 10MB
    }
  }
};
```

## 客户端连接

### 浏览器客户端

```javascript
// 创建 WebSocket 连接
const ws = new WebSocket('ws://localhost:3001/ws');

// 连接建立
ws.onopen = () => {
  console.log('Connected to server');
  
  // 发送消息
  ws.send(JSON.stringify({
    type: 'chat',
    content: 'Hello, Server!'
  }));
};

// 接收消息
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
  
  switch (message.type) {
    case 'welcome':
      console.log('Welcome:', message.content);
      break;
      
    case 'chat':
      console.log(`${message.from}: ${message.content}`);
      break;
      
    case 'user_joined':
      console.log('User joined:', message.content.clientId);
      break;
      
    case 'user_left':
      console.log('User left:', message.content.clientId);
      break;
  }
};

// 连接关闭
ws.onclose = () => {
  console.log('Disconnected from server');
};

// 错误处理
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

// 心跳检测
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }));
  }
}, 10000);
```

### Node.js 客户端

```typescript
import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:3001/ws');

ws.on('open', () => {
  console.log('Connected');
  
  ws.send(JSON.stringify({
    type: 'chat',
    content: 'Hello from Node.js!'
  }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  console.log('Received:', message);
});

ws.on('close', () => {
  console.log('Disconnected');
});
```

## 最佳实践

### 1. 使用类型定义消息

```typescript
// types/websocket.ts
export interface WSMessage {
  type: MessageType;
  content?: any;
  from?: string;
  timestamp?: number;
}

export enum MessageType {
  WELCOME = 'welcome',
  CHAT = 'chat',
  TYPING = 'typing',
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
  PING = 'ping',
  PONG = 'pong',
  ERROR = 'error'
}
```

### 2. 错误处理

```typescript
@WsController('/ws')
export class SafeController {
  @GetMapping('/')
  async handleMessage(@RequestBody() message: any): Promise<any> {
    try {
      return await this.processMessage(message);
    } catch (error) {
      this.logger.error('Message processing error:', error);
      
      return {
        type: 'error',
        message: 'Failed to process message',
        timestamp: Date.now()
      };
    }
  }
  
  private async processMessage(message: any): Promise<any> {
    // 处理逻辑
  }
}
```

### 3. 连接清理

```typescript
@WsController('/ws')
export class CleanController {
  private static clients: Map<string, any> = new Map();
  private static resources: Map<string, any> = new Map();
  
  async onConnection(): Promise<void> {
    const clientId = this.ctx.id;
    CleanController.clients.set(clientId, this.ctx);
    
    // 分配资源
    const resource = await this.allocateResource();
    CleanController.resources.set(clientId, resource);
  }
  
  async onDisconnection(): Promise<void> {
    const clientId = this.ctx.id;
    
    // 清理资源
    const resource = CleanController.resources.get(clientId);
    if (resource) {
      await this.releaseResource(resource);
      CleanController.resources.delete(clientId);
    }
    
    CleanController.clients.delete(clientId);
  }
}
```

### 4. 日志记录

```typescript
@WsController('/ws')
export class LoggedController {
  @Logger()
  logger: any;
  
  async onConnection(): Promise<void> {
    this.logger.info(`WebSocket connected: ${this.ctx.id}, IP: ${this.ctx.ip}`);
  }
  
  @GetMapping('/')
  async handleMessage(@RequestBody() message: any): Promise<any> {
    this.logger.debug(`WebSocket message from ${this.ctx.id}: ${JSON.stringify(message)}`);
    
    // 处理消息...
    
    return result;
  }
  
  async onDisconnection(): Promise<void> {
    this.logger.info(`WebSocket disconnected: ${this.ctx.id}`);
  }
}
```
