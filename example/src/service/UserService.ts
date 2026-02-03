/**
 * 用户服务层
 * 
 * 演示 Service 层的业务逻辑封装
 * 包含用户的 CRUD 操作
 */
import { Service, Config, Cacheable, CacheEvict } from 'koatty';
import { App } from '../App';

/**
 * 用户实体接口
 */
export interface User {
  id: number;
  username: string;
  email: string;
  age?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * 创建用户参数
 */
export interface CreateUserDto {
  username: string;
  email: string;
  age?: number;
}

/**
 * 更新用户参数
 */
export interface UpdateUserDto {
  username?: string;
  email?: string;
  age?: number;
}

/**
 * 用户服务类
 * 
 * @Service - 声明为服务层组件
 */
@Service()
export class UserService {
  // 注入 App 实例
  app: App;
  
  // 模拟数据存储（实际项目应使用数据库）
  private users: User[] = [
    { id: 1, username: 'admin', email: 'admin@example.com', age: 25, createdAt: new Date() },
    { id: 2, username: 'user1', email: 'user1@example.com', age: 30, createdAt: new Date() }
  ];
  
  private nextId = 3;
  
  /**
   * 获取所有用户
   * 
   * @Cacheable - 缓存方法返回值
   * @param page - 页码
   * @param limit - 每页数量
   * @returns 用户列表
   */
  @Cacheable('user:list', 60) // 缓存 60 秒
  async findAll(page: number = 1, limit: number = 10): Promise<{ users: User[]; total: number }> {
    // 模拟异步操作
    await this.delay(100);
    
    const start = (page - 1) * limit;
    const end = start + limit;
    const users = this.users.slice(start, end);
    
    return {
      users,
      total: this.users.length
    };
  }
  
  /**
   * 根据 ID 获取用户
   * 
   * @Cacheable - 缓存单个用户数据
   * @param id - 用户 ID
   * @returns 用户对象或 null
   */
  @Cacheable('user:{id}', 300) // 缓存 300 秒
  async findById(id: number): Promise<User | null> {
    await this.delay(50);
    const user = this.users.find(u => u.id === id);
    return user || null;
  }
  
  /**
   * 创建用户
   * 
   * @param data - 用户数据
   * @returns 创建的用户
   */
  async create(data: CreateUserDto): Promise<User> {
    await this.delay(100);
    
    const user: User = {
      id: this.nextId++,
      username: data.username,
      email: data.email,
      age: data.age,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.users.push(user);
    
    this.app.logger.info(`用户创建成功: ${user.username}`);
    
    return user;
  }
  
  /**
   * 更新用户
   * 
   * @CacheEvict - 清除相关缓存
   * @param id - 用户 ID
   * @param data - 更新数据
   * @returns 更新后的用户或 null
   */
  @CacheEvict(['user:{id}', 'user:list'])
  async update(id: number, data: UpdateUserDto): Promise<User | null> {
    await this.delay(100);
    
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) {
      return null;
    }
    
    this.users[index] = {
      ...this.users[index],
      ...data,
      updatedAt: new Date()
    };
    
    this.app.logger.info(`用户更新成功: ${id}`);
    
    return this.users[index];
  }
  
  /**
   * 删除用户
   * 
   * @CacheEvict - 清除相关缓存
   * @param id - 用户 ID
   * @returns 是否删除成功
   */
  @CacheEvict(['user:{id}', 'user:list'])
  async delete(id: number): Promise<boolean> {
    await this.delay(50);
    
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) {
      return false;
    }
    
    this.users.splice(index, 1);
    
    this.app.logger.info(`用户删除成功: ${id}`);
    
    return true;
  }
  
  /**
   * 根据用户名查找用户
   * 
   * @param username - 用户名
   * @returns 用户对象或 null
   */
  async findByUsername(username: string): Promise<User | null> {
    await this.delay(50);
    return this.users.find(u => u.username === username) || null;
  }
  
  /**
   * 模拟异步延迟
   * @param ms - 毫秒
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
