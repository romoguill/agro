import { Body, Controller, Get, Post } from '@nestjs/common';
import { LoginDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  @Post('login')
  login(@Body() loginDto: LoginDto) {}

  @Get('protected')
  getHello(): string {
    return 'hello';
  }
}
