import {
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import jwt from 'jsonwebtoken';

type GoogleResponse = {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
  id_token: string;
};

type GoogleUser = {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
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

    user.refreshToken = refreshToken;

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

  // Returns the url for redirecting user to the consent sceen to authorize email and profile scopes access
  async getGoogleConsentUrl() {
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
    return url;
  }

  // Main service for handling OAuth flow after recieving the PKCE code
  async googleOAuth(code: string) {
    try {
      const { id_token, access_token } = await this.googleExchangeTokens(code);

      // Couldn't find this part in google docs. Basicaly the id_token has the user profile, but I don't think I can trust that. Better to make a separate request to google's profiles service and check if provided access token works
      const googleProfile = await this.getGoogleProfile(id_token, access_token);

      console.log(googleProfile);
      // User must have verified email in google or else can't trust the user to own the email
      if (!googleProfile.verified_email) {
        throw new UnauthorizedException('Email provided is not verified');
      }

      let user = await this.usersService.findOneByEmail(googleProfile.email);

      // Create user
      if (!user) {
        user = await this.usersService.create({
          email: googleProfile.email,
          name: googleProfile.name,
          googleId: googleProfile.id,
        });
      }

      const payload = { email: user.email, sub: user.id };

      const accessToken = this.generateToken(payload, 'access_token');
      const refreshToken = this.generateToken(payload, 'refresh_token');

      user.refreshToken = refreshToken;

      await this.usersService.update(user.id, user);

      return { accessToken, refreshToken };
    } catch (error) {
      console.log(error);
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Something went wrong with Google Auth',
      );
    }
  }

  // Parses response from google auth server
  private async googleExchangeTokens(code: string) {
    const baseUrl = 'https://oauth2.googleapis.com/token';

    const options = {
      code,
      client_id: this.configService.getOrThrow('GOOGLE_CLIENT_ID'),
      client_secret: this.configService.getOrThrow('GOOGLE_CLIENT_SECRET'),
      redirect_uri: this.configService.getOrThrow('GOOGLE_CALLBACK_URL'),
      grant_type: 'authorization_code',
    };

    const response = await this.httpService.axiosRef.post<GoogleResponse>(
      baseUrl,
      options,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data;
  }

  private async getGoogleProfile(idToken: string, accessToken: string) {
    const baseUrl = `https://www.googleapis.com/oauth2/v1/userinfo?alt=json`;

    try {
      const response = await this.httpService.axiosRef.get<GoogleUser>(
        baseUrl,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        'Something went wrong with Google Auth',
      );
    }
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

  signInWithGoogle(idToken: string) {
    type GoogleUser = {
      iss: string;
      azp: string;
      aud: string;
      sub: string;
      email: string;
      email_verified: boolean;
      at_hash: string;
      name: string;
      picture: string;
      given_name: string;
      family_name: string;
      iat: Date;
      exp: Date;
    };

    const userPayload = jwt.decode(idToken) as unknown as GoogleUser;

    // Check if user exists. The idea is that if the user had logged in before with credentials, update data with google credentials
    const user = this.usersService.findOneByEmail(userPayload.email);

    if (!user) {
    }
  }
}
