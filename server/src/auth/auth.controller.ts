import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { AuthGuard } from './auth.guard';
import { CookieOptions, Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Authentication')
@UseInterceptors(ClassSerializerInterceptor)
@Controller('auth')
export class AuthController {
  private readonly accessCookieConfig: CookieOptions;
  private readonly refreshCookieConfig: CookieOptions;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    this.accessCookieConfig = {
      maxAge: this.configService.getOrThrow('ACCESS_TOKEN_EXPIRES_IN'),
      httpOnly: true,
      sameSite: 'strict',
      secure: this.configService.getOrThrow('NODE_ENV') === 'production',
    };

    this.refreshCookieConfig = {
      maxAge: this.configService.getOrThrow('REFRESH_TOKEN_EXPIRES_IN'),
      httpOnly: true,
      sameSite: 'strict',
      secure: this.configService.getOrThrow('NODE_ENV') === 'production',
      path: `${this.configService.getOrThrow('API_URL')}/auth/refresh`,
    };
  }

  @Post('login')
  async login(
    @Res({ passthrough: true }) res: Response,
    @Body() loginDto: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { accessToken, refreshToken } =
      await this.authService.login(loginDto);

    res.cookie('access_token', accessToken, this.accessCookieConfig);

    res.cookie('refresh_token', refreshToken, this.refreshCookieConfig);

    console.log('fin');
    return { accessToken, refreshToken };
  }

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // If refreshing is successfull set the access token in cookie
  // If refreshing fails, delete cookies from user and ask to sign in again
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refresh_token'];

    if (!refreshToken)
      throw new UnauthorizedException(
        'Invalid refresh token. Must sign in again.',
      );

    try {
      const accessToken = await this.authService.refresh(refreshToken);

      res.cookie('access_token', accessToken, this.accessCookieConfig);

      return { accessToken };
    } catch (error) {
      const { maxAge: _a, ...deleteOptionsRefresh } = this.refreshCookieConfig;
      const { maxAge: _b, ...deleteOptionsAccess } = this.accessCookieConfig;
      res.clearCookie('access_token', deleteOptionsAccess);
      res.clearCookie('refresh_token', deleteOptionsRefresh);
      throw error;
    }
  }

  // Delete refreshtoken from user db and delete cookies
  @Post('/logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    console.log({ refreshToken });

    try {
      await this.authService.logout(refreshToken);
    } catch (error) {
      console.log(error);
    } finally {
      const { maxAge: _a, ...deleteOptionsRefresh } = this.refreshCookieConfig;
      const { maxAge: _b, ...deleteOptionsAccess } = this.accessCookieConfig;
      res.clearCookie('access_token', deleteOptionsAccess);
      res.clearCookie('refresh_token', deleteOptionsRefresh);
      return;
    }
  }

  @Get('/google')
  googleConsentScreen() {
    this.authService.googleConsentScreen();
  }

  @Get('/google/callback')
  googleCallback(@Query('code') code: string) {
    this.authService.googleExchangeTokens(code);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  getMe(@Req() req: Request) {
    return req.user;
  }

  @Get('protected')
  getHello(): string {
    return 'hello';
  }
}
