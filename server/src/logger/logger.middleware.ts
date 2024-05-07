import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger();
  use(req: Request, res: Response, next: () => void) {
    const { method, baseUrl, query, body } = req;

    this.logger.log(
      `Request: ${method} ${baseUrl} ${JSON.stringify(query)} ${JSON.stringify(body)}`,
    );
    next();
  }
}
