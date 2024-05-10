import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const accessToken = request.cookies.access_token;

    if (!accessToken)
      throw new UnauthorizedException(
        'Must be authenticated to access this endpoint.',
      );

    try {
      this.jwtService.verify<JWTPayload>(accessToken);
    } catch (error) {
      throw new UnauthorizedException(
        'Must be authenticated to access this endpoint.',
      );
    }

    return true;
  }
}
