import type {
  IAuthenticationService,
  TAuthCredentials,
  TAuthCredentialsDTO,
} from '../types/auth.js';
import type {
  IUserHandler,
  IUserPresentation,
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
  private presentationService: IUserPresentation;

  constructor(
    userService: IUserService,
    authService: IAuthenticationService,
    presentationService: IUserPresentation
  ) {
    this.userService = userService;
    this.authService = authService;
    this.presentationService = presentationService;
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
    const response = this.presentationService.registerUser(user);
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
    const response = this.presentationService.authenticateUser(authResponse);
    return h.response(response).code(201);
  }

  public async reAuthenticateUser(r: R, h: H): Promise<Lf.ReturnValue> {
    const refreshToken = r.payload as { refreshToken: string };
    checkData(refreshToken, this.validator.putAuthSchema);
    const newAccessToken = await this.authService.refreshToken(
      refreshToken.refreshToken
    );
    const response =
      this.presentationService.reAuthenticateUser(newAccessToken);
    return h.response(response).code(200);
  }

  public async deauthenticateUser(r: R, h: H): Promise<Lf.ReturnValue> {
    const { refreshToken } = checkData<{ refreshToken: string }>(
      r.payload,
      this.validator.deleteAuthSchema
    );
    await this.authService.invalidateToken(refreshToken);
    const response = this.presentationService.deauthenticateUser(refreshToken);
    return h.response(response).code(200);
  }
}

export default UserHandler;
