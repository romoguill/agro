import { Body, Controller, Post } from '@nestjs/common';
import { LoginDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  @Post('login')
  login(@Body() loginDto: LoginDto) {}
}
