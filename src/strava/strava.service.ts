import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class StravaService {
  constructor(private readonly httpService: HttpService) {}

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

  async getActivities(accessToken: string) {
    const response = await firstValueFrom(
      this.httpService.get('https://www.strava.com/api/v3/athlete/activities', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          page: 1,
          per_page: 30,
        },
      }),
    );

    return response.data;
  }
}