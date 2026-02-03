/**
 * 用户相关 DTO（数据传输对象）
 * 
 * 用于参数验证和数据传输
 */
import { 
  IsString, 
  IsEmail, 
  IsNumber, 
  IsOptional, 
  MinLength, 
  MaxLength,
  Min,
  Max
} from 'class-validator';

/**
 * 创建用户 DTO
 */
export class CreateUserDto {
  @IsString({ message: '用户名必须是字符串' })
  @MinLength(3, { message: '用户名最少 3 个字符' })
  @MaxLength(20, { message: '用户名最多 20 个字符' })
  username: string;
  
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;
  
  @IsOptional()
  @IsNumber({}, { message: '年龄必须是数字' })
  @Min(0, { message: '年龄不能小于 0' })
  @Max(150, { message: '年龄不能大于 150' })
  age?: number;
}

/**
 * 更新用户 DTO
 */
export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: '用户名必须是字符串' })
  @MinLength(3, { message: '用户名最少 3 个字符' })
  @MaxLength(20, { message: '用户名最多 20 个字符' })
  username?: string;
  
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;
  
  @IsOptional()
  @IsNumber({}, { message: '年龄必须是数字' })
  @Min(0, { message: '年龄不能小于 0' })
  @Max(150, { message: '年龄不能大于 150' })
  age?: number;
}
