/**
 * 插件配置文件
 * 配置插件的加载和参数
 */
export default {
  // 加载的插件列表
  list: [
    // 'TypeormPlugin',     // TypeORM 数据库插件
    // 'RedisPlugin',       // Redis 缓存插件
    // 'SchedulePlugin',    // 定时任务插件
    // 'SwaggerPlugin'      // Swagger 文档插件
  ],
  
  // 插件配置
  config: {
    // TypeORM 插件配置
    TypeormPlugin: {
      enabled: false,
      // 配置项会合并 db.ts 中的配置
    },
    
    // Redis 插件配置
    RedisPlugin: {
      enabled: false,
      host: '127.0.0.1',
      port: 6379,
      password: '',
      db: 0,
      keyPrefix: 'koatty:'
    },
    
    // 定时任务插件配置
    SchedulePlugin: {
      enabled: false
    },
    
    // Swagger 插件配置
    SwaggerPlugin: {
      enabled: true,
      // Swagger UI 路径
      route: '/docs',
      // API 文档标题
      title: 'Koatty Example API',
      // API 文档描述
      description: 'Koatty 框架示例项目 API 文档',
      // API 版本
      version: '1.0.0',
      // 扫描的控制器路径
      scanPath: './controller',
      // 安全认证配置
      security: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  }
};
