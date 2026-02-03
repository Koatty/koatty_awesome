/**
 * 通用配置文件
 * 包含日志、应用基础配置等
 */
export default {
  // 应用名称
  appName: 'Koatty Example App',
  
  // 应用版本
  version: '1.0.0',
  
  // 日志配置
  logger: {
    // 日志级别: debug, info, warn, error
    level: 'debug',
    // 日志输出路径
    path: '${LOGS_PATH}',
    // 是否输出到控制台
    console: true,
    // 是否写入文件
    file: true,
    // 日志文件保留天数
    maxFiles: 30
  },
  
  // 跨域配置
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
  },
  
  // JWT 配置
  jwt: {
    secret: 'your-secret-key-change-in-production',
    expiresIn: '24h',
    issuer: 'koatty-example'
  },
  
  // 响应配置
  response: {
    // 是否启用标准化响应
    standard: true,
    // 成功状态码
    successCode: 200,
    // 错误状态码
    errorCode: 500
  }
};
