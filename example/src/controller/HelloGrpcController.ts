/**
 * gRPC 控制器示例
 * 
 * 演示 gRPC 服务的实现，包括四种流类型
 */
import { 
  GrpcController, 
  PostMapping, 
  RequestBody,
  Validated,
  Logger
} from 'koatty';
import { App } from '../App';

/**
 * 问候请求 DTO
 */
class HelloRequestDto {
  name: string;
  age?: number;
}

/**
 * 问候响应 DTO
 */
class HelloReplyDto {
  message: string;
  timestamp: number;
}

/**
 * 聊天消息 DTO
 */
class ChatMessageDto {
  from: string;
  content: string;
  timestamp: number;
}

/**
 * gRPC 控制器
 * 
 * @GrpcController - 声明为 gRPC 控制器
 * 路径必须与 proto 文件中的 service 名称一致
 */
@GrpcController('/Hello')
export class HelloGrpcController {
  app: App;
  ctx: any;
  
  @Logger()
  logger: any;
  
  constructor(ctx: any) {
    this.ctx = ctx;
  }
  
  /**
   * 简单问候方法
   * 
   * @PostMapping - 映射 gRPC 方法
   * 路径必须与 proto 中的方法名一致
   * 
   * 对应 proto: rpc SayHello (HelloRequest) returns (HelloReply);
   */
  @PostMapping('/SayHello')
  @Validated()
  async sayHello(@RequestBody() request: HelloRequestDto): Promise<HelloReplyDto> {
    this.logger.info(`gRPC SayHello: ${request.name}`);
    
    const age = request.age || 0;
    const message = age > 0 
      ? `Hello, ${request.name}! You are ${age} years old.`
      : `Hello, ${request.name}!`;
    
    return {
      message,
      timestamp: Date.now()
    };
  }
  
  /**
   * 服务器流 - 批量发送问候
   * 
   * 对应 proto: rpc SayHelloStream (HelloRequest) returns (stream HelloReply);
   */
  @PostMapping('/SayHelloStream')
  async sayHelloStream(@RequestBody() request: HelloRequestDto): Promise<void> {
    this.logger.info(`gRPC SayHelloStream: ${request.name}`);
    
    // 发送多条消息
    for (let i = 1; i <= 5; i++) {
      const message: HelloReplyDto = {
        message: `Hello ${request.name}! Message ${i}/5`,
        timestamp: Date.now()
      };
      
      // 写入流
      this.ctx.writeStream(message);
      
      // 模拟延迟
      await this.delay(500);
    }
    
    // 结束流
    this.ctx.endStream();
  }
  
  /**
   * 客户端流 - 接收多个问候
   * 
   * 对应 proto: rpc ReceiveHellos (stream HelloRequest) returns (HelloSummary);
   */
  @PostMapping('/ReceiveHellos')
  async receiveHellos(): Promise<any> {
    this.logger.info('gRPC ReceiveHellos');
    
    // 从流中接收消息
    const messages: HelloRequestDto[] = [];
    
    // 在实际场景中，ctx.streamMessage 会包含客户端发送的消息
    if (this.ctx.streamMessage) {
      messages.push(this.ctx.streamMessage);
    }
    
    // 返回摘要
    return {
      count: messages.length,
      names: messages.map(m => m.name)
    };
  }
  
  /**
   * 双向流 - 聊天
   * 
   * 对应 proto: rpc Chat (stream ChatMessage) returns (stream ChatMessage);
   */
  @PostMapping('/Chat')
  async chat(): Promise<void> {
    this.logger.info('gRPC Chat started');
    
    // 接收客户端消息并回复
    if (this.ctx.streamMessage) {
      const received: ChatMessageDto = this.ctx.streamMessage;
      
      this.logger.info(`Received from ${received.from}: ${received.content}`);
      
      // 回复消息
      const reply: ChatMessageDto = {
        from: 'Server',
        content: `Echo: ${received.content}`,
        timestamp: Date.now()
      };
      
      this.ctx.writeStream(reply);
    }
  }
  
  /**
   * 延迟辅助方法
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
