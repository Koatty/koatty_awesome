/**
 * 数据库配置文件
 * 支持多种数据库类型
 */
export default {
  // 数据库类型: mysql, postgresql, sqlite, mongodb
  type: 'mysql',
  
  // 数据库主机
  host: '127.0.0.1',
  
  // 数据库端口
  port: 3306,
  
  // 数据库名称
  database: 'koatty_example',
  
  // 数据库用户名
  username: 'root',
  
  // 数据库密码
  password: '',
  
  // 表前缀
  prefix: '',
  
  // 字符集
  charset: 'utf8mb4',
  
  // 连接池配置
  pool: {
    min: 2,
    max: 10,
    acquireTimeout: 60000,
    idleTimeout: 30000
  },
  
  // 是否启用日志
  logging: true,
  
  // 是否自动同步表结构（生产环境建议关闭）
  synchronize: false,
  
  // 实体文件路径
  entities: ['${APP_PATH}/model/entity/*.ts'],
  
  // 迁移文件路径
  migrations: ['${APP_PATH}/migration/*.ts']
};
