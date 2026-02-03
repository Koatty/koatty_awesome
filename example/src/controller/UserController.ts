/**
 * 首页控制器
 * 
 * 演示基本的 HTTP 控制器功能
 */
import { 
  Controller, 
  GetMapping, 
  PostMapping,
  PutMapping,
  DeleteMapping,
  RequestBody,
  PathVariable,
  QueryParam,
  Autowired,
  Validated,
  Logger
} from 'koatty';
import { App } from '../App';
import { UserService, User } from '../service/UserService';
import { CreateUserDto, UpdateUserDto } from '../dto/UserDto';

/**
 * 首页控制器
 * 
 * @Controller - 声明为 HTTP 控制器
 * 路径前缀: / (默认)
 */
@Controller('/')
export class IndexController {
  // 注入 App 实例
  app: App;
  
  // 注入上下文（每个请求独立）
  ctx: any;
  
  /**
   * 构造函数
   * 必须接收 ctx 参数并赋值给 this.ctx
   */
  constructor(ctx: any) {
    this.ctx = ctx;
  }
  
  /**
   * 首页
   * 
   * @GetMapping - GET 请求映射
   * 访问: GET /
   */
  @GetMapping('/')
  index(): any {
    return {
      code: 200,
      message: 'Welcome to Koatty Example API',
      data: {
        name: 'Koatty Example',
        version: '1.0.0',
        documentation: '/api/docs',
        health: '/api/health'
      }
    };
  }
  
  /**
   * 健康检查
   * 
   * 访问: GET /health
   */
  @GetMapping('/health')
  health(): any {
    return {
      code: 200,
      message: 'OK',
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }
    };
  }
}

/**
 * 用户控制器
 * 
 * 演示完整的 RESTful API 实现
 * 路径前缀: /api/users
 */
@Controller('/api/users')
export class UserController {
  app: App;
  ctx: any;
  
  // 注入日志器
  @Logger()
  logger: any;
  
  // 注入 UserService
  @Autowired()
  userService: UserService;
  
  constructor(ctx: any) {
    this.ctx = ctx;
  }
  
  /**
   * 获取用户列表
   * 
   * 访问: GET /api/users
   * 参数: ?page=1&limit=10
   */
  @GetMapping('/')
  async getUsers(
    @QueryParam('page') page: number = 1,
    @QueryParam('limit') limit: number = 10
  ): Promise<any> {
    this.logger.info(`获取用户列表: page=${page}, limit=${limit}`);
    
    const result = await this.userService.findAll(page, limit);
    
    return {
      code: 200,
      message: '获取成功',
      data: result
    };
  }
  
  /**
   * 根据 ID 获取用户
   * 
   * 访问: GET /api/users/:id
   * 参数: id - 用户 ID
   */
  @GetMapping('/:id')
  async getUserById(@PathVariable('id') id: number): Promise<any> {
    this.logger.info(`获取用户: id=${id}`);
    
    const user = await this.userService.findById(id);
    
    if (!user) {
      this.ctx.status = 404;
      return {
        code: 404,
        message: '用户不存在',
        data: null
      };
    }
    
    return {
      code: 200,
      message: '获取成功',
      data: user
    };
  }
  
  /**
   * 创建用户
   * 
   * 访问: POST /api/users
   * @Validated - 启用参数验证
   */
  @PostMapping('/')
  @Validated()
  async createUser(@RequestBody() data: CreateUserDto): Promise<any> {
    this.logger.info(`创建用户: ${JSON.stringify(data)}`);
    
    // 检查用户名是否已存在
    const existingUser = await this.userService.findByUsername(data.username);
    if (existingUser) {
      this.ctx.status = 409;
      return {
        code: 409,
        message: '用户名已存在',
        data: null
      };
    }
    
    const user = await this.userService.create(data);
    
    this.ctx.status = 201;
    return {
      code: 201,
      message: '创建成功',
      data: user
    };
  }
  
  /**
   * 更新用户
   * 
   * 访问: PUT /api/users/:id
   */
  @PutMapping('/:id')
  @Validated()
  async updateUser(
    @PathVariable('id') id: number,
    @RequestBody() data: UpdateUserDto
  ): Promise<any> {
    this.logger.info(`更新用户: id=${id}, data=${JSON.stringify(data)}`);
    
    const user = await this.userService.update(id, data);
    
    if (!user) {
      this.ctx.status = 404;
      return {
        code: 404,
        message: '用户不存在',
        data: null
      };
    }
    
    return {
      code: 200,
      message: '更新成功',
      data: user
    };
  }
  
  /**
   * 删除用户
   * 
   * 访问: DELETE /api/users/:id
   */
  @DeleteMapping('/:id')
  async deleteUser(@PathVariable('id') id: number): Promise<any> {
    this.logger.info(`删除用户: id=${id}`);
    
    const success = await this.userService.delete(id);
    
    if (!success) {
      this.ctx.status = 404;
      return {
        code: 404,
        message: '用户不存在',
        data: null
      };
    }
    
    return {
      code: 200,
      message: '删除成功',
      data: null
    };
  }
}
