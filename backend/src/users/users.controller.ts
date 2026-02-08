import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    // Remove passwordHash from response
    return users.map(({ passwordHash, ...user }) => user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    // For testing only - use /auth/register in production
    const passwordHash = `test_${createUserDto.password}`;
    const user = await this.usersService.create({
      email: createUserDto.email,
      username: createUserDto.username,
      passwordHash,
    });
    // Remove passwordHash from response
    const { passwordHash: _, ...result } = user;
    return result;
  }
}
