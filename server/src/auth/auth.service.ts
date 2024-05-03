import { Injectable } from '@nestjs/common';
import { LoginDto } from './dto/auth.dto';

const mockUsers = [
  {
    id: 1,
    email: 'test1@test.com',
    password: 'pass123',
  },
  {
    id: 2,
    email: 'test2@test.com',
    password: 'pass123',
  },
];

@Injectable()
export class AuthService {
  validateUser({ email, password }: LoginDto) {}
}
