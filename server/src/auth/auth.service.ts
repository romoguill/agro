import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register({ email, password, name }: RegisterDto) {
    const user = await this.usersService.findOneByEmail(email);

    if (user) {
      throw new ConflictException('Email already in use');
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    return this.usersService.create({ email, password: hashedPassword, name });
  }

  async login({ email, password }: LoginDto) {
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user.id };

    const accessToken = this.generateToken(payload, 'access_token');
    const refreshToken = this.generateToken(payload, 'refresh_token');

    await this.usersService.update(user.id, user);

    return { accessToken, refreshToken };
  }

  // Verifies if jwt is valid (checks secret and expiration). If its ok, generate a new access token
  async refresh(refreshToken: string) {
    try {
      const jwtVerified = this.jwtService.verify<JWTPayload>(refreshToken);

      const user = await this.usersService.findOne(jwtVerified.sub);

      const payload = { email: user.email, sub: user.id };

      return this.generateToken(payload, 'access_token');
    } catch (error) {
      throw new UnauthorizedException(
        'Invalid refresh token. Must sign in again.',
      );
    }
  }

  async logout(refreshToken: string) {
    const jwtVerified = this.jwtService.verify<JWTPayload>(refreshToken);

    const user = await this.usersService.findOne(jwtVerified.sub);

    await this.usersService.update(user.id, { refreshToken: null });
  }

  async googleSignIn() {
    this.createGoogleOAuthURL();
  }

  // Util for generating both access or refresh token
  private generateToken(
    payload: Omit<JWTPayload, 'iat' | 'exp'>,
    type: 'access_token' | 'refresh_token',
  ) {
    if (type === 'access_token') {
      return this.jwtService.sign(payload, {
        expiresIn: this.configService.getOrThrow('ACCESS_TOKEN_EXPIRES_IN'),
      });
    } else {
      return this.jwtService.sign(payload, {
        expiresIn: this.configService.getOrThrow('REFRESH_TOKEN_EXPIRES_IN'),
      });
    }
  }

  private createGoogleOAuthURL() {
    const baseUrl = 'http://accounts.google.com/o/oauth2/v2/auth';

    const options = {
      redirect_uri: this.configService.getOrThrow('GOOGLE_CALLBACK_URL'),
      client_id: this.configService.getOrThrow('GOOGLE_CLIENT_ID'),
      access_type: 'offline',
      response_type: 'code',
      propmpt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ].join(' '),
    };

    const searchParams = new URLSearchParams(options);

    const url = new URL(baseUrl);

    url.search = searchParams.toString();

    console.log(url);
    return url;
  }
}
