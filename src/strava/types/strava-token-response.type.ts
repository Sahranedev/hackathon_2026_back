export type StravaTokenResponse = {
  token_type: 'Bearer';
  expires_at: number;
  expires_in: number;
  refresh_token: string;
  access_token: string;
  scope?: string;

  athlete: {
    id: number;
    username?: string | null;
    firstname?: string | null;
    lastname?: string | null;
    profile?: string | null;
  };
};
