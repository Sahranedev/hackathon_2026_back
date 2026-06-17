import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Redirect,
  Req,
} from '@nestjs/common';
import { Public } from '../security/decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.signIn(loginDto);
  }

  @Public()
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.signUp(registerDto);
  }

  @Get('me')
  me(@Req() req: { user: unknown }) {
    return req.user;
  }

  @Get('strava/connect')
  async connectStrava(@Req() req: any) {
    const userId = req.user.id;

    return this.authService.createStravaAuthorizationUrl(userId);
  }

  @Public()
  @Get('strava/callback')
  @Redirect('', 302)
  async stravaCallback(
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('scope') scope?: string,
    @Query('error') error?: string,
  ) {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

    if (error) {
      return {
        url: `${frontendUrl}/settings?strava=denied`,
      };
    }

    if (!code || !state) {
      return {
        url: `${frontendUrl}/settings?strava=error`,
      };
    }

    await this.authService.linkStravaAccountFromCallback(code, state, scope);

    return {
      url: `${frontendUrl}/settings?strava=connected`,
    };
  }
}
