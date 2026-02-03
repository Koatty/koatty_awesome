/**
 * 日志中间件
 * 
 * 记录所有 HTTP 请求的信息
 */
import { Middleware } from 'koatty';
import { App } from '../App';

/**
 * 日志中间件类
 * 
 * @Middleware - 声明为中间件组件
 */
@Middleware()
export class LoggerMiddleware {
  /**
   * 中间件执行方法
   * 
   * @param options - 中间件配置选项
   * @param app - 应用实例
   * @returns Koa 中间件函数
   */
  run(options: any, app: App) {
    // 中间件配置
    const config = {
      logBody: options?.logBody ?? false,
      logResponse: options?.logResponse ?? false,
      ignorePaths: options?.ignorePaths || ['/health', '/favicon.ico']
    };
    
    return async (ctx: any, next: any) => {
      // 检查是否需要忽略
      if (config.ignorePaths.some((path: string) => ctx.path.includes(path))) {
        return await next();
      }
      
      const start = Date.now();
      
      // 记录请求信息
      const requestInfo = {
        method: ctx.method,
        url: ctx.url,
        ip: ctx.ip,
        userAgent: ctx.get('user-agent'),
        timestamp: new Date().toISOString()
      };
      
      // 可选：记录请求体
      if (config.logBody && ctx.requestBody) {
        (requestInfo as any).body = ctx.requestBody;
      }
      
      console.log(`[REQUEST] ${requestInfo.method} ${requestInfo.url} - ${requestInfo.ip}`);
      
      try {
        // 执行后续中间件和控制器
        await next();
        
        const duration = Date.now() - start;
        
        // 记录响应信息
        const responseInfo = {
          status: ctx.status,
          duration: `${duration}ms`
        };
        
        // 可选：记录响应体
        if (config.logResponse && ctx.body) {
          (responseInfo as any).body = ctx.body;
        }
        
        console.log(`[RESPONSE] ${ctx.status} - ${duration}ms`);
        
      } catch (error) {
        const duration = Date.now() - start;
        console.error(`[ERROR] ${ctx.method} ${ctx.url} - ${duration}ms`, error);
        throw error;
      }
    };
  }
}
