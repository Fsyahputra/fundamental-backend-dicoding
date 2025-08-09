import type {
  Request as R,
  ResponseToolkit as H,
  Lifecycle as Lf,
} from '@hapi/hapi';
import type { TDataResponse, TMessageResponse } from './shared.js';
import type { TAuthResponse } from './auth.js';

export type TUserDTO = {
  id?: string;
  username: string;
  password: string;
  fullname: string;
};

export type TUser = Omit<TUserDTO, 'id'> & {
  id: string;
};

export interface IUserService {
  save: (user: TUserDTO) => Promise<TUser>;
  getById: (id: string) => Promise<TUser | null>;
  getByUsername: (username: string) => Promise<TUser | null>;
  getManyByIds: (ids: string[]) => Promise<TUser[]>;
}

export interface IUserHandler {
  registerUser: (r: R, h: H) => Promise<Lf.ReturnValue>;
  authenticateUser: (r: R, h: H) => Promise<Lf.ReturnValue>;
  reAuthenticateUser: (r: R, h: H) => Promise<Lf.ReturnValue>;
  deauthenticateUser: (r: R, h: H) => Promise<Lf.ReturnValue>;
}

export interface IUserPresentation {
  registerUser: (user: TUser) => TDataResponse<{ userId: string }>;
  authenticateUser: (
    authResponse: TAuthResponse
  ) => TDataResponse<TAuthResponse>;
  reAuthenticateUser: (
    accessToken: string
  ) => TDataResponse<{ accessToken: string }>;
  deauthenticateUser: (token: string) => TMessageResponse;
}
