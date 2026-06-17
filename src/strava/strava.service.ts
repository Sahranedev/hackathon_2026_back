import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { StravaActivity } from 'src/activities/types/strava-activity.type';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class StravaService {
  constructor(
    private readonly httpService: HttpService,
    private readonly prismaService: PrismaService,
  ) {}

  buildAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: process.env.STRAVA_CLIENT_ID!,
      redirect_uri: process.env.STRAVA_REDIRECT_URI!,
      response_type: 'code',
      approval_prompt: 'auto',
      scope: 'read,activity:read_all',
      state,
    });

    return `https://www.strava.com/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string) {
    const response = await firstValueFrom(
      this.httpService.post('https://www.strava.com/oauth/token', null, {
        params: {
          client_id: process.env.STRAVA_CLIENT_ID,
          client_secret: process.env.STRAVA_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
        },
      }),
    );

    return response.data;
  }

  async getValidAccessToken(userId: number): Promise<string> {
    const account = await this.prismaService.stravaAccount.findUnique({
      where: {
        userId,
      },
    });

    if (!account) {
      throw new NotFoundException('Aucun compte Strava lié à cet utilisateur.');
    }

    const now = Math.floor(Date.now() / 1000);

    if (account.expiresAt && account.expiresAt > now + 60) {
      return account.accessToken;
    }

    const refreshedToken = await this.refreshAccessToken(account.refreshToken);

    await this.prismaService.stravaAccount.update({
      where: {
        userId,
      },
      data: {
        accessToken: refreshedToken.access_token,
        refreshToken: refreshedToken.refresh_token,
        expiresAt: refreshedToken.expires_at,
      },
    });

    return refreshedToken.access_token;
  }

  async refreshAccessToken(refreshToken: string) {
    const response = await firstValueFrom(
      this.httpService.post('https://www.strava.com/oauth/token', null, {
        params: {
          client_id: process.env.STRAVA_CLIENT_ID,
          client_secret: process.env.STRAVA_CLIENT_SECRET,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        },
      }),
    );

    return response.data;
  }

  async getActivities(userId: number): Promise<StravaActivity[]> {
    const accessToken = await this.getValidAccessToken(userId);

    const response = await firstValueFrom(
      this.httpService.get<StravaActivity[]>(
        'https://www.strava.com/api/v3/athlete/activities',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            page: 1,
            per_page: 30,
          },
        },
      ),
    );

    return response.data;
  }
}
