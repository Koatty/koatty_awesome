/**
 * 认证中间件
 * 
 * 验证 JWT Token，保护需要认证的路由
 */
import { Middleware } from 'koatty';
import { App } from '../App';

/**
 * JWT Payload 接口
 */
interface JwtPayload {
  userId: number;
  username: string;
  iat: number;
  exp: number;
}

/**
 * 认证中间件类
 * 
 * @Middleware - 声明为中间件组件
 */
@Middleware()
export class AuthMiddleware {
  run(options: any, app: App) {
    // 中间件配置
    const config = {
      secret: options?.secret || 'your-secret-key',
      ignorePaths: options?.ignorePaths || [],
      enabled: options?.enabled ?? true
    };
    
    return async (ctx: any, next: any) => {
      // 如果中间件被禁用，直接通过
      if (!config.enabled) {
        return await next();
      }
      
      // 检查是否需要忽略
      if (config.ignorePaths.some((path: string) => ctx.path.includes(path))) {
        return await next();
      }
      
      // 从请求头获取 Token
      const authHeader = ctx.get('authorization');
      
      if (!authHeader) {
        ctx.status = 401;
        ctx.body = {
          code: 401,
          message: '未提供认证令牌',
          data: null
        };
        return;
      }
      
      // 解析 Token
      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        ctx.status = 401;
        ctx.body = {
          code: 401,
          message: '认证令牌格式错误',
          data: null
        };
        return;
      }
      
      const token = parts[1];
      
      try {
        // 这里简化处理，实际应该使用 jwt.verify
        // const decoded = jwt.verify(token, config.secret) as JwtPayload;
        
        // 模拟验证成功
        const decoded: JwtPayload = {
          userId: 1,
          username: 'demo',
          iat: Date.now() / 1000,
          exp: Date.now() / 1000 + 3600
        };
        
        // 将用户信息挂载到上下文
        ctx.user = decoded;
        
        await next();
        
      } catch (error) {
        ctx.status = 401;
        ctx.body = {
          code: 401,
          message: '认证令牌无效或已过期',
          data: null
        };
      }
    };
  }
}
