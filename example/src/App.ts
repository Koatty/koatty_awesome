/**
 * Koatty 应用入口文件
 * 
 * 这是应用程序的启动入口，配置了整个应用的初始化参数和生命周期
 */
import { Koatty, Bootstrap, ComponentScan, ConfiguationScan } from 'koatty';

/**
 * 启动前的初始化函数
 * 可以在这里设置环境变量、调整线程池大小等
 */
const bootstrapFn = () => {
  // 调整 libuv 线程池大小（用于文件 I/O、DNS 解析等）
  // process.env.UV_THREADPOOL_SIZE = '128';
  
  // 忽略 HTTPS 自签名证书验证（开发环境使用）
  // process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  
  // 设置时区
  process.env.TZ = 'Asia/Shanghai';
  
  console.log('🚀 Koatty Example App 正在启动...');
};

/**
 * 应用主类
 * 
 * @Bootstrap - 定义项目入口，接受初始化函数
 * @ComponentScan - 定义组件扫描路径，默认 './'
 * @ConfiguationScan - 定义配置文件目录，默认 './config'
 */
@Bootstrap(bootstrapFn)
@ComponentScan('./')
@ConfiguationScan('./config')
export class App extends Koatty {
  /**
   * 应用初始化方法
   * 在应用启动时执行一次
   */
  public init(): void {
    // 设置调试模式
    // true: 开发模式，启用热重载、详细日志等
    // false: 生产模式
    (this as any).appDebug = process.env.NODE_ENV !== 'production';
    
    // 设置应用名称
    (this as any).appName = 'Koatty Example';
    
    // 设置应用版本
    (this as any).appVersion = '1.0.0';
    
    console.log(`📦 应用: ${(this as any).appName} v${(this as any).appVersion}`);
    console.log(`🔧 模式: ${(this as any).appDebug ? '开发' : '生产'}`);
  }
}

// 导出 App 实例类型
export type AppInstance = App;
