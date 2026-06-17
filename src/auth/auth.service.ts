import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { verifyPassword } from '../common/password.util';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { StravaService } from 'src/strava/strava.service';
import { randomUUID } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ReferralsService } from 'src/referrals/referrals.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
    private readonly usersService: UsersService,
    private readonly stravaService: StravaService,
    private readonly referralsService: ReferralsService,
  ) {}

  async signUp(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByMail(registerDto.mail);
    if (existingUser) {
      throw new ConflictException('Un compte avec cet email existe déjà');
    }

    if (!registerDto.password) {
      throw new BadRequestException('Le mot de passe est requis');
    }

    const { referralCode, ...userData } = registerDto;

    const user = await this.usersService.create(userData);

    await this.referralsService.ensureReferralCode(user.id);

    if (referralCode) {
      await this.referralsService.linkReferrer(user.id, referralCode);
    }

    return user;
  }

  async signIn(loginDto: LoginDto) {
    const user = await this.usersService.findByMail(loginDto.mail);
    if (!user?.password) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const isPasswordValid = await verifyPassword(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const payload = { sub: user.id, email: user.mail, roles: user.roles };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async createStravaAuthorizationUrl(userId: number) {
    const state = randomUUID();

    await this.prismaService.oAuthState.create({
      data: {
        id: state,
        provider: 'strava',
        userId,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const authorizationUrl = this.stravaService.buildAuthorizationUrl(state);

    return {
      authorizationUrl,
    };
  }

  async linkStravaAccountFromCallback(
    code: string,
    state: string,
    scopeFromQuery?: string,
  ) {
    const oauthState = await this.prismaService.oAuthState.findUnique({
      where: { id: state },
    });

    if (!oauthState || oauthState.provider !== 'strava') {
      throw new BadRequestException('State OAuth invalide.');
    }

    if (oauthState.expiresAt < new Date()) {
      await this.prismaService.oAuthState.delete({
        where: { id: oauthState.id },
      });

      throw new BadRequestException('State OAuth expiré.');
    }

    const tokenData = await this.stravaService.exchangeCodeForToken(code);
    const athlete = tokenData.athlete;

    const existingAccount = await this.prismaService.stravaAccount.findUnique({
      where: {
        athleteId: athlete.id,
      },
    });

    if (existingAccount && existingAccount.userId !== oauthState.userId) {
      throw new ConflictException(
        'Ce compte Strava est déjà lié à un autre utilisateur.',
      );
    }

    await this.prismaService.stravaAccount.upsert({
      where: {
        userId: oauthState.userId,
      },
      update: {
        athleteId: athlete.id,
        username: athlete.username,
        firstname: athlete.firstname,
        lastname: athlete.lastname,
        profile: athlete.profile,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: tokenData.expires_at,
        scope: tokenData.scope ?? scopeFromQuery,
      },
      create: {
        userId: oauthState.userId,
        athleteId: athlete.id,
        username: athlete.username,
        firstname: athlete.firstname,
        lastname: athlete.lastname,
        profile: athlete.profile,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: tokenData.expires_at,
        scope: tokenData.scope ?? scopeFromQuery,
      },
    });

    await this.prismaService.oAuthState.delete({
      where: { id: oauthState.id },
    });

    return {
      connected: true,
    };
  }

  generateToken() {
    const payload = { role: 'admin' };
    return this.jwtService.sign(payload);
  }
}
