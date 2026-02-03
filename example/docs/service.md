# 服务层教程

服务层（Service）用于封装业务逻辑，保持控制器的简洁，并实现代码复用。

## 目录

- [基本概念](#基本概念)
- [创建服务](#创建服务)
- [使用服务](#使用服务)
- [缓存注解](#缓存注解)
- [最佳实践](#最佳实践)

## 基本概念

### 为什么需要服务层？

1. **保持控制器简洁**: 控制器只负责接收请求和返回响应
2. **代码复用**: 多个控制器可以共享同一个服务
3. **易于测试**: 业务逻辑独立，方便单元测试
4. **关注点分离**: 业务逻辑与 HTTP 协议解耦

### 架构层次

```
Controller (控制器层)
    ↓
Service (服务层) ← 业务逻辑
    ↓
Repository/Model (数据层)
```

## 创建服务

### 基本结构

```typescript
import { Service } from 'koatty';
import { App } from '../App';

@Service()
export class UserService {
  // 自动注入 App 实例
  app: App;
  
  // 业务方法
  async findAll(): Promise<User[]> {
    // 实现业务逻辑
    return [];
  }
}
```

### 完整示例

```typescript
import { Service, Cacheable, CacheEvict } from 'koatty';
import { App } from '../App';

// 用户实体接口
export interface User {
  id: number;
  username: string;
  email: string;
  age?: number;
}

// 创建用户参数
export interface CreateUserDto {
  username: string;
  email: string;
  age?: number;
}

@Service()
export class UserService {
  app: App;
  
  // 模拟数据库
  private users: User[] = [];
  private nextId = 1;
  
  /**
   * 获取所有用户
   * 
   * @Cacheable - 缓存结果
   * 参数1: 缓存 key
   * 参数2: 过期时间（秒）
   */
  @Cacheable('user:list', 60)
  async findAll(page: number = 1, limit: number = 10): Promise<{ users: User[]; total: number }> {
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return {
      users: this.users.slice(start, end),
      total: this.users.length
    };
  }
  
  /**
   * 根据 ID 获取用户
   * 
   * 支持动态 key: {id} 会被替换为实际参数值
   */
  @Cacheable('user:{id}', 300)
  async findById(id: number): Promise<User | null> {
    return this.users.find(u => u.id === id) || null;
  }
  
  /**
   * 创建用户
   */
  async create(data: CreateUserDto): Promise<User> {
    const user: User = {
      id: this.nextId++,
      ...data
    };
    
    this.users.push(user);
    
    // 记录日志
    this.app.logger.info(`User created: ${user.username}`);
    
    return user;
  }
  
  /**
   * 更新用户
   * 
   * @CacheEvict - 清除缓存
   * 参数: 要清除的缓存 key 数组
   */
  @CacheEvict(['user:{id}', 'user:list'])
  async update(id: number, data: Partial<CreateUserDto>): Promise<User | null> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    
    this.users[index] = { ...this.users[index], ...data };
    
    this.app.logger.info(`User updated: ${id}`);
    
    return this.users[index];
  }
  
  /**
   * 删除用户
   */
  @CacheEvict(['user:{id}', 'user:list'])
  async delete(id: number): Promise<boolean> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return false;
    
    this.users.splice(index, 1);
    
    this.app.logger.info(`User deleted: ${id}`);
    
    return true;
  }
  
  /**
   * 根据用户名查找
   * （不加缓存，因为查询条件不固定）
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.users.find(u => u.username === username) || null;
  }
}
```

## 使用服务

### 在控制器中注入

```typescript
import { Controller, GetMapping, Autowired } from 'koatty';
import { UserService } from '../service/UserService';

@Controller('/api/users')
export class UserController {
  app: App;
  ctx: any;
  
  // 注入服务
  @Autowired()
  userService: UserService;
  
  constructor(ctx: any) {
    this.ctx = ctx;
  }
  
  @GetMapping('/')
  async getUsers() {
    // 使用服务
    const result = await this.userService.findAll();
    return { code: 200, data: result };
  }
  
  @GetMapping('/:id')
  async getUser(@PathVariable('id') id: number) {
    const user = await this.userService.findById(id);
    return { code: 200, data: user };
  }
}
```

### 在服务中注入其他服务

```typescript
import { Service, Autowired } from 'koatty';

@Service()
export class OrderService {
  app: App;
  
  // 注入其他服务
  @Autowired()
  userService: UserService;
  
  @Autowired()
  productService: ProductService;
  
  async createOrder(userId: number, productId: number) {
    // 使用其他服务
    const user = await this.userService.findById(userId);
    const product = await this.productService.findById(productId);
    
    // 创建订单逻辑...
  }
}
```

## 缓存注解

### @Cacheable

缓存方法返回值，下次调用时直接返回缓存数据。

```typescript
@Service()
export class ProductService {
  /**
   * 基本用法
   */
  @Cacheable('products', 300)  // 缓存 5 分钟
  async getProducts() {
    // 从数据库查询
    return await this.db.query('SELECT * FROM products');
  }
  
  /**
   * 动态 key
   * {id} 会被替换为参数值
   */
  @Cacheable('product:{id}', 600)
  async getProduct(id: number) {
    return await this.db.query('SELECT * FROM products WHERE id = ?', [id]);
  }
  
  /**
   * 多个参数
   * {category}-{page} 会被替换为实际值
   */
  @Cacheable('products:{category}:{page}', 300)
  async getByCategory(category: string, page: number) {
    return await this.db.query(
      'SELECT * FROM products WHERE category = ? LIMIT ?, 10',
      [category, (page - 1) * 10]
    );
  }
}
```

### @CacheEvict

清除缓存，通常在更新或删除操作后使用。

```typescript
@Service()
export class ProductService {
  @Cacheable('product:{id}', 600)
  async getProduct(id: number) { ... }
  
  @Cacheable('products', 300)
  async getProducts() { ... }
  
  /**
   * 清除单个缓存
   */
  @CacheEvict('product:{id}')
  async updateProduct(id: number, data: any) {
    await this.db.update('products', data, { id });
  }
  
  /**
   * 清除多个缓存
   */
  @CacheEvict(['product:{id}', 'products'])
  async deleteProduct(id: number) {
    await this.db.delete('products', { id });
  }
  
  /**
   * 清除所有产品缓存
   */
  @CacheEvict(['products', 'product:*'])
  async clearCache() {
    // 手动清除逻辑
  }
}
```

## 事务处理

```typescript
import { Service } from 'koatty';

@Service()
export class PaymentService {
  app: App;
  
  async processPayment(orderId: number, amount: number) {
    // 开始事务
    const transaction = await this.db.beginTransaction();
    
    try {
      // 扣减库存
      await this.db.query(
        'UPDATE products SET stock = stock - 1 WHERE id = ?',
        [orderId],
        { transaction }
      );
      
      // 创建支付记录
      await this.db.insert('payments', {
        order_id: orderId,
        amount: amount,
        status: 'completed'
      }, { transaction });
      
      // 更新订单状态
      await this.db.update('orders', {
        status: 'paid',
        paid_at: new Date()
      }, { id: orderId }, { transaction });
      
      // 提交事务
      await transaction.commit();
      
      return { success: true };
      
    } catch (error) {
      // 回滚事务
      await transaction.rollback();
      throw error;
    }
  }
}
```

## 最佳实践

### 1. 命名规范

```typescript
// ✅ 好的命名
UserService
OrderService
ProductCategoryService

// ❌ 避免
UserSvc
ServiceUser
MyService
```

### 2. 方法命名

```typescript
// ✅ 使用动词开头
async findAll() { }
async findById(id: number) { }
async create(data: any) { }
async update(id: number, data: any) { }
async delete(id: number) { }
async validate(data: any) { }

// ❌ 避免
async get() { }  // 太笼统
async handle() { }  // 不明确
```

### 3. 错误处理

```typescript
@Service()
export class UserService {
  async findById(id: number): Promise<User> {
    const user = await this.db.findOne(id);
    
    if (!user) {
      throw new Error(`User not found: ${id}`);
    }
    
    return user;
  }
  
  async create(data: CreateUserDto): Promise<User> {
    // 验证数据
    if (!data.username || data.username.length < 3) {
      throw new Error('Username must be at least 3 characters');
    }
    
    // 检查重复
    const existing = await this.findByUsername(data.username);
    if (existing) {
      throw new Error('Username already exists');
    }
    
    // 创建用户
    return await this.db.insert(data);
  }
}
```

### 4. 日志记录

```typescript
@Service()
export class UserService {
  app: App;
  
  async create(data: CreateUserDto): Promise<User> {
    this.app.logger.info(`Creating user: ${data.username}`);
    
    try {
      const user = await this.db.insert(data);
      this.app.logger.info(`User created: ${user.id}`);
      return user;
    } catch (error) {
      this.app.logger.error(`Failed to create user: ${error.message}`);
      throw error;
    }
  }
}
```

### 5. 不要直接返回数据库实体

```typescript
@Service()
export class UserService {
  // ✅ 转换为 DTO 返回
  async findById(id: number): Promise<UserDto> {
    const user = await this.db.findOne(id);
    return this.toDto(user);
  }
  
  private toDto(user: any): UserDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      // 不返回敏感信息如密码
    };
  }
  
  // ❌ 不要直接返回
  async findByIdBad(id: number) {
    return await this.db.findOne(id);  // 包含所有字段
  }
}
```

### 6. 服务不要依赖 HTTP 上下文

```typescript
@Service()
export class UserService {
  // ✅ 通过参数传递数据
  async create(data: CreateUserDto, operatorId: number) {
    // 使用 operatorId 记录操作人
  }
  
  // ❌ 不要直接访问 ctx
  async createBad(data: CreateUserDto) {
    const operatorId = this.ctx.user.id;  // 错误！
  }
}
```
