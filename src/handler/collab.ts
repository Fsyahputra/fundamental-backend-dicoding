import autoBind from 'auto-bind';
import type {
  ICollabhandler,
  ICollabPresentation,
  ICollabService,
  TCollabDTO,
  TCollabServiceDependency,
} from '../types/collab.js';
import type {
  Request as R,
  ResponseToolkit as H,
  Lifecycle as Lf,
} from '@hapi/hapi';
import { type TUser, type IUserService } from '../types/users.js';
import { type TPlaylist, type IPlayListService } from '../types/playlist.js';
import { checkData, checkIsExist } from '../utils.js';
import type { IAuthorizationService } from '../types/authorization.js';
import collabValidator from '../schema/collab.js';
import type { ICacheService } from '../types/cache.js';
import COLLAB from '../constant/collab.js';

class CollabHandler implements ICollabhandler {
  private validator = collabValidator;
  private collabService: ICollabService;
  private userService: IUserService;
  private playlistService: IPlayListService;
  private authorizationService: IAuthorizationService;
  private presentationService: ICollabPresentation;
  private cacheService: ICacheService;
  constructor(deps: TCollabServiceDependency) {
    this.collabService = deps.collabService;
    this.userService = deps.userService;
    this.playlistService = deps.playlistService;
    this.authorizationService = deps.authorizationService;
    this.presentationService = deps.presentationService;
    this.cacheService = deps.cacheService;
    autoBind(this);
  }

  private async deleteCollabAndOwnerCache(playlistId: string, ownerId: string) {
    const allUserId = await this.collabService.getUserIdByPlaylistId(
      playlistId
    );
    await this.cacheService.del(
      COLLAB.HANDLER.CACHE_KEYS.usersPlaylists(ownerId)
    );
    if (allUserId) {
      await Promise.all(
        allUserId.map((userId) =>
          this.cacheService.del(
            COLLAB.HANDLER.CACHE_KEYS.usersPlaylists(userId)
          )
        )
      );
    }
  }

  private async ensurePlaylistExists(playlistId: string): Promise<TPlaylist> {
    const playlist = await checkIsExist<TPlaylist>(
      COLLAB.HANDLER.ERROR_MESSAGES.playlistNotFound(playlistId),
      () => this.playlistService.getById(playlistId)
    );
    return playlist;
  }

  public async postCollab(r: R, h: H): Promise<Lf.ReturnValue> {
    const collabData = checkData<TCollabDTO>(
      r.payload,
      this.validator.postCollab
    );
    const id = this.authorizationService.getUserIdFromRequest(r);
    const playlist = await this.ensurePlaylistExists(collabData.playlistId);
    await this.deleteCollabAndOwnerCache(collabData.playlistId, id);
    await checkIsExist<TUser>(
      COLLAB.HANDLER.ERROR_MESSAGES.userNotFound(collabData.userId),
      () => this.userService.getById(collabData.userId)
    );
    this.authorizationService.ensureOwnerShip(id, playlist);
    const collab = await this.collabService.addCollab(collabData);

    const response = this.presentationService.postCollab(collab);
    return h.response(response).code(201);
  }

  public async deleteCollab(r: R, h: H): Promise<Lf.ReturnValue> {
    const collabData = checkData<TCollabDTO>(
      r.payload,
      this.validator.deleteCollab
    );
    const id = this.authorizationService.getUserIdFromRequest(r);
    await this.deleteCollabAndOwnerCache(collabData.playlistId, id);
    const playlist = await this.ensurePlaylistExists(collabData.playlistId);
    this.authorizationService.ensureOwnerShip(id, playlist);
    const collab = await this.collabService.removeCollab(collabData);

    const response = this.presentationService.deleteCollab(collab);
    return h.response(response).code(200);
  }
}

export default CollabHandler;
