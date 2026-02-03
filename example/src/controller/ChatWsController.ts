/**
 * WebSocket 控制器示例
 * 
 * 演示 WebSocket 实时通信功能
 */
import { 
  WsController, 
  GetMapping,
  RequestBody,
  Autowired,
  Logger
} from 'koatty';
import { App } from '../App';

/**
 * WebSocket 消息接口
 */
interface WsMessage {
  type: string;
  data?: any;
  timestamp?: number;
}

/**
 * WebSocket 控制器
 * 
 * @WsController - 声明为 WebSocket 控制器
 */
@WsController('/ws')
export class ChatWsController {
  app: App;
  ctx: any;
  
  @Logger()
  logger: any;
  
  // 存储所有连接的客户端
  private static clients: Map<string, any> = new Map();
  
  constructor(ctx: any) {
    this.ctx = ctx;
  }
  
  /**
   * 处理 WebSocket 连接
   * 
   * 当客户端连接时触发
   */
  async onConnection(): Promise<void> {
    const clientId = this.ctx.id || Math.random().toString(36).substr(2, 9);
    
    ChatWsController.clients.set(clientId, this.ctx);
    
    this.logger.info(`WebSocket 客户端连接: ${clientId}`);
    this.logger.info(`当前在线客户端数: ${ChatWsController.clients.size}`);
    
    // 发送欢迎消息
    this.sendMessage({
      type: 'connected',
      data: {
        clientId,
        message: '欢迎连接到 Koatty WebSocket 服务器!'
      },
      timestamp: Date.now()
    });
    
    // 广播新用户加入
    this.broadcast({
      type: 'user_joined',
      data: {
        clientId,
        totalUsers: ChatWsController.clients.size
      }
    }, clientId);
  }
  
  /**
   * 处理 WebSocket 消息
   * 
   * @GetMapping - 映射消息处理
   * 访问: WebSocket /ws
   */
  @GetMapping('/')
  async handleMessage(@RequestBody() message: WsMessage): Promise<any> {
    this.logger.info(`收到 WebSocket 消息: ${JSON.stringify(message)}`);
    
    const clientId = this.ctx.id || 'unknown';
    
    switch (message.type) {
      case 'chat':
        // 处理聊天消息
        return this.handleChatMessage(clientId, message);
        
      case 'ping':
        // 心跳响应
        return {
          type: 'pong',
          timestamp: Date.now()
        };
        
      case 'broadcast':
        // 广播消息
        this.broadcast({
          type: 'broadcast',
          data: {
            from: clientId,
            content: message.data
          }
        });
        return { type: 'sent' };
        
      default:
        return {
          type: 'error',
          data: '未知的消息类型'
        };
    }
  }
  
  /**
   * 处理聊天消息
   */
  private handleChatMessage(clientId: string, message: WsMessage): any {
    const chatMessage = {
      type: 'chat',
      data: {
        from: clientId,
        content: message.data,
        timestamp: Date.now()
      }
    };
    
    // 广播给所有客户端
    this.broadcast(chatMessage);
    
    return { type: 'sent' };
  }
  
  /**
   * 处理 WebSocket 断开连接
   */
  async onDisconnection(): Promise<void> {
    const clientId = this.ctx.id || 'unknown';
    
    ChatWsController.clients.delete(clientId);
    
    this.logger.info(`WebSocket 客户端断开: ${clientId}`);
    this.logger.info(`当前在线客户端数: ${ChatWsController.clients.size}`);
    
    // 广播用户离开
    this.broadcast({
      type: 'user_left',
      data: {
        clientId,
        totalUsers: ChatWsController.clients.size
      }
    });
  }
  
  /**
   * 发送消息给当前客户端
   */
  private sendMessage(message: WsMessage): void {
    if (this.ctx.websocket) {
      this.ctx.websocket.send(JSON.stringify(message));
    }
  }
  
  /**
   * 广播消息给所有客户端
   * @param excludeId - 排除的客户端 ID
   */
  private broadcast(message: WsMessage, excludeId?: string): void {
    const messageStr = JSON.stringify(message);
    
    ChatWsController.clients.forEach((ctx, id) => {
      if (id !== excludeId && ctx.websocket) {
        try {
          ctx.websocket.send(messageStr);
        } catch (error) {
          this.logger.error(`发送消息给客户端 ${id} 失败:`, error);
        }
      }
    });
  }
}
