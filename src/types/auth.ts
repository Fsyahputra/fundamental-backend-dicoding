import type { JwtPayload } from "jsonwebtoken";

export interface IAuthenticationService {
  authenticate: (credentials: TAuthCredentials) => Promise<TAuthResponse>;
  refreshToken: (token: string) => Promise<string>;
  invalidateToken: (token: string) => Promise<void>;
  verifyAccessToken: (token: string) => Promise<TAuthObj>;
}

export type TAuthResponse = {
  accessToken: string;
  refreshToken: string;
};

export type TAuthCredentialsDTO = {
  username: string;
  password: string;
};

export type TAuthCredentials = TAuthCredentialsDTO & {
  userId: string;
  hashedPassword: string;
};

export interface TAuthObj extends JwtPayload {
  id: string;
  username: string;
  iat: number;
  exp: number;
}
