import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { AuthGuard } from './auth.guard';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  async login(
    @Res({ passthrough: true }) res: Response,
    @Body() loginDto: LoginDto,
  ) {
    const { accessToken, refreshToken } =
      await this.authService.login(loginDto);

    res.cookie('access_token', accessToken, {
      maxAge: this.configService.getOrThrow('ACCESS_TOKEN_EXPIRES_IN'),
      httpOnly: true,
      sameSite: 'strict',
      secure: this.configService.getOrThrow('NODE_ENV') === 'production',
    });

    res.cookie('refresh_token', refreshToken, {
      maxAge: this.configService.getOrThrow('REFRESH_TOKEN_EXPIRES_IN'),
      httpOnly: true,
      sameSite: 'strict',
      secure: this.configService.getOrThrow('NODE_ENV') === 'production',
      path: `${this.configService.getOrThrow('API_URL')}/auth/refresh`,
    });

    console.log('fin');
    return { accessToken, refreshToken };
  }

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('protected')
  getHello(): string {
    return 'hello';
  }

  @Get('me')
  @UseGuards(AuthGuard)
  getMe(@Req() req: Request) {
    return req.user;
  }
}
