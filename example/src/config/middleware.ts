/**
 * 中间件配置文件
 * 配置全局中间件的加载和参数
 */
export default {
  // 加载的中间件列表（按顺序执行）
  list: [
    'TraceMiddleware',     // 链路追踪
    'CorsMiddleware',      // 跨域处理
    'PayloadMiddleware',   // 请求体解析
    'LoggerMiddleware',    // 请求日志
    'AuthMiddleware'       // 认证中间件（可选）
  ],
  
  // 中间件配置
  config: {
    // 链路追踪中间件
    TraceMiddleware: {
      enabled: true,
      samplingRate: 1.0 // 采样率 0-1
    },
    
    // 跨域中间件
    CorsMiddleware: {
      enabled: true,
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true
    },
    
    // 请求体解析中间件
    PayloadMiddleware: {
      enabled: true,
      limit: '20mb',
      encoding: 'utf-8',
      multipart: true
    },
    
    // 日志中间件
    LoggerMiddleware: {
      enabled: true,
      // 是否记录请求体
      logBody: false,
      // 是否记录响应体
      logResponse: false,
      // 忽略的 URL 路径
      ignorePaths: ['/health', '/favicon.ico']
    },
    
    // 认证中间件
    AuthMiddleware: {
      enabled: false, // 默认关闭，需要时开启
      // 忽略的 URL 路径（不需要认证）
      ignorePaths: [
        '/api/auth/login',
        '/api/auth/register',
        '/api/health',
        '/api/docs'
      ],
      // JWT 密钥
      secret: 'your-secret-key-change-in-production'
    }
  }
};
