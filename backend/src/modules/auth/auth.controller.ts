import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password || '');
  }

  @Post('signup')
  async signup(@Body() body: { email: string; password: string; full_name?: string; role?: string }) {
    return this.authService.signup(body.email, body.password || '', body.full_name || '', body.role || 'user');
  }
}
