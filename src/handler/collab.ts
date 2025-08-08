import autoBind from 'auto-bind';
import type {
  ICollabhandler,
  ICollabPresentation,
  ICollabService,
  TCollabDTO,
} from '../types/collab.js';
import type {
  Request as R,
  ResponseToolkit as H,
  Lifecycle as Lf,
} from '@hapi/hapi';
import { type TUser, type IUserService } from '../types/users.js';
import { type TPLaylist, type IPlayListService } from '../types/playlist.js';
import { checkIsExist } from '../utils.js';
import type { IAuthorizationService } from '../types/authorization.js';

class CollabHandler implements ICollabhandler {
  private collabService: ICollabService;
  private userService: IUserService;
  private playlistService: IPlayListService;
  private authorizationService: IAuthorizationService;
  private presentationService: ICollabPresentation;

  constructor(
    collabService: ICollabService,
    userService: IUserService,
    playlistService: IPlayListService,
    authorizationService: IAuthorizationService,
    presentationService: ICollabPresentation
  ) {
    this.collabService = collabService;
    this.userService = userService;
    this.playlistService = playlistService;
    this.authorizationService = authorizationService;
    this.presentationService = presentationService;
    autoBind(this);
  }

  public async postCollab(r: R, h: H): Promise<Lf.ReturnValue> {
    const { playlistId, userId } = r.payload as TCollabDTO;
    const collabData: TCollabDTO = { playlistId, userId };
    const id = this.authorizationService.getUserIdFromRequest(r);
    const playlist = await checkIsExist<TPLaylist>(
      `Playlist with id ${playlistId} not found`,
      () => this.playlistService.getById(playlistId)
    );
    await checkIsExist<TUser>(`User with id ${userId} not found`, () =>
      this.userService.getById(userId)
    );
    this.authorizationService.ensureOwnerShip(id, playlist);
    const collab = await this.collabService.addCollab(collabData);
    const response = this.presentationService.postCollab(collab);
    return h.response(response).code(201);
  }

  public async deleteCollab(r: R, h: H): Promise<Lf.ReturnValue> {
    const { playlistId, userId } = r.payload as TCollabDTO;
    const id = this.authorizationService.getUserIdFromRequest(r);
    const collabData: TCollabDTO = { playlistId, userId };
    const playlist = await checkIsExist<TPLaylist>(
      `Playlist with id ${playlistId} not found`,
      () => this.playlistService.getById(playlistId)
    );
    this.authorizationService.ensureOwnerShip(id, playlist);
    const collab = await this.collabService.removeCollab(collabData);
    const response = this.presentationService.deleteCollab(collab);
    return h.response(response).code(200);
  }
}

export default CollabHandler;
