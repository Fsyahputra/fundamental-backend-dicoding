import type {
  IAuthenticationService,
  TAuthCredentials,
  TAuthCredentialsDTO,
} from '../types/auth.js';
import type { TResponse } from '../types/shared.js';
import type {
  IUserHandler,
  IUserService,
  TUser,
  TUserDTO,
} from '../types/users.js';
import UserValidation from '../schema/user.js';
import type {
  Request as R,
  ResponseToolkit as H,
  Lifecycle as Lf,
} from '@hapi/hapi';
import { UnauthorizedError } from '../exception.js';
import autoBind from 'auto-bind';
import { checkData } from '../utils.js';

class UserHandler implements IUserHandler {
  private userService: IUserService;
  private authService: IAuthenticationService;
  private validator = UserValidation;

  constructor(userService: IUserService, authService: IAuthenticationService) {
    this.userService = userService;
    this.authService = authService;
    autoBind(this);
  }

  private async ensureUserExists(username: string): Promise<TUser> {
    const user = await this.userService.getByUsername(username);
    if (!user) {
      throw new UnauthorizedError(`User with username ${username} not found`);
    }
    return user;
  }

  public async registerUser(r: R, h: H): Promise<Lf.ReturnValue> {
    const userData = r.payload as TUserDTO;
    checkData(userData, this.validator.postSchema);
    const user = await this.userService.save(userData);
    const response: TResponse = {
      status: 'success',
      data: {
        userId: user.id,
      },
    };
    return h.response(response).code(201);
  }

  public async authenticateUser(r: R, h: H): Promise<Lf.ReturnValue> {
    const credentials = r.payload as TAuthCredentialsDTO;
    checkData(credentials, this.validator.postAuthSchema);
    const user = await this.ensureUserExists(credentials.username);
    const credData: TAuthCredentials = {
      ...credentials,
      userId: user.id,
      hashedPassword: user.password,
    };
    const authResponse = await this.authService.authenticate(credData);
    const response: TResponse = {
      status: 'success',
      data: {
        accessToken: authResponse.accessToken,
        refreshToken: authResponse.refreshToken,
      },
    };
    return h.response(response).code(201);
  }

  public async reAuthenticateUser(r: R, h: H): Promise<Lf.ReturnValue> {
    const refreshToken = r.payload as { refreshToken: string };
    checkData(refreshToken, this.validator.putAuthSchema);
    const newAccessToken = await this.authService.refreshToken(
      refreshToken.refreshToken
    );
    const response: TResponse = {
      status: 'success',
      data: {
        accessToken: newAccessToken,
      },
    };
    return h.response(response).code(200);
  }

  public async deauthenticateUser(r: R, h: H): Promise<Lf.ReturnValue> {
    const refreshToken = r.payload as { refreshToken: string };
    checkData(refreshToken, this.validator.deleteAuthSchema);
    await this.authService.invalidateToken(refreshToken.refreshToken);
    const response: TResponse = {
      status: 'success',
      message: 'User successfully deauthenticated',
    };
    return h.response(response).code(200);
  }
}

export default UserHandler;
