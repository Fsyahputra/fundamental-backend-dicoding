import type { TAuthResponse } from '../types/auth.js';
import type { TDataResponse, TMessageResponse } from '../types/shared.js';
import type { IUserPresentation, TUser } from '../types/users.js';

class UserPresentation implements IUserPresentation {
  public registerUser: (user: TUser) => TDataResponse<{ userId: string }> = (
    user
  ) => {
    return {
      status: 'success',
      data: {
        userId: user.id,
      },
    };
  };

  public authenticateUser: (
    authResponse: TAuthResponse
  ) => TDataResponse<TAuthResponse> = (authResponse) => {
    return {
      status: 'success',
      data: {
        accessToken: authResponse.accessToken,
        refreshToken: authResponse.refreshToken,
      },
    };
  };

  public reAuthenticateUser: (
    accessToken: string
  ) => TDataResponse<{ accessToken: string }> = (accessToken) => {
    return {
      status: 'success',
      data: {
        accessToken,
      },
    };
  };

  public deauthenticateUser: (token: string) => TMessageResponse = (token) => {
    return {
      status: 'success',
      message: `User with token ${token} has been deauthenticated.`,
    };
  };
}

export default UserPresentation;
