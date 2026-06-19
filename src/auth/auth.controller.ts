import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Redirect,
  Req,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Public } from '../security/decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { CurrentUser } from '../security/decorators/current-user.decorator';
import type { AuthenticatedUser } from './types/authenticated-request.type';
import { UsersService } from '../users/users.service';
import {
  AuthTokenResponseDto,
  CurrentUserProfileResponseDto,
  ErrorResponseDto,
  SafeUserResponseDto,
  StravaAuthorizationResponseDto,
} from '../docs/api-response.dto';
import {
  ApiConflictError,
  ApiJwtAuth,
  ApiResourceNotFound,
  ApiValidationError,
} from '../docs/swagger.decorators';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Connecter un utilisateur avec email et mot de passe.' })
  @ApiCreatedResponse({
    description: 'Connexion reussie. Retourne le JWT applicatif.',
    type: AuthTokenResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Identifiants invalides.',
    type: ErrorResponseDto,
  })
  login(@Body() loginDto: LoginDto) {
    return this.authService.signIn(loginDto);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Creer un compte utilisateur.' })
  @ApiCreatedResponse({
    description: 'Compte cree.',
    type: SafeUserResponseDto,
  })
  @ApiValidationError('Email, mot de passe ou code de parrainage invalide.')
  @ApiConflictError('Un compte avec cet email existe deja.')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.signUp(registerDto);
  }

  @Get('me')
  @ApiJwtAuth()
  @ApiOperation({ summary: 'Recuperer le profil de l utilisateur authentifie.' })
  @ApiOkResponse({
    description: 'Profil courant enrichi.',
    type: CurrentUserProfileResponseDto,
  })
  @ApiResourceNotFound('Utilisateur introuvable.')
  me(@CurrentUser() authenticatedUser: AuthenticatedUser) {
    return this.usersService.getCurrentUserProfile(authenticatedUser.id);
  }

  @Get('strava/connect')
  @ApiJwtAuth()
  @ApiOperation({ summary: 'Generer l URL OAuth Strava pour l utilisateur courant.' })
  @ApiOkResponse({
    description: 'URL d autorisation Strava.',
    type: StravaAuthorizationResponseDto,
  })
  async connectStrava(@Req() req: any) {
    const userId = req.user.id;

    return this.authService.createStravaAuthorizationUrl(userId);
  }

  @Public()
  @Get('strava/callback')
  @Redirect('', 302)
  @ApiOperation({
    summary: 'Callback OAuth Strava appele par Strava apres autorisation.',
  })
  @ApiQuery({ name: 'code', required: false, type: String })
  @ApiQuery({ name: 'state', required: false, type: String })
  @ApiQuery({ name: 'scope', required: false, type: String })
  @ApiQuery({ name: 'error', required: false, type: String })
  @ApiResponse({
    status: 302,
    description:
      'Redirige vers le front avec strava=connected, strava=denied ou strava=error.',
  })
  @ApiValidationError('State OAuth invalide ou expire.')
  @ApiConflictError('Compte Strava deja lie a un autre utilisateur.')
  async stravaCallback(
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('scope') scope?: string,
    @Query('error') error?: string,
  ) {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

    if (error) {
      return {
        url: `${frontendUrl}/activites?strava=denied`,
      };
    }

    if (!code || !state) {
      return {
        url: `${frontendUrl}/activites?strava=error`,
      };
    }

    await this.authService.linkStravaAccountFromCallback(code, state, scope);

    return {
      url: `${frontendUrl}/activites?strava=connected`,
    };
  }
}
