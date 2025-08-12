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

  private async deleteCacheForAllCollaborators(playlistId: string) {
    const allUserId = await this.collabService.getUserIdByPlaylistId(
      playlistId
    );
    if (allUserId) {
      await Promise.all(
        allUserId.map((userId) =>
          this.cacheService.del(`user:${userId}:playlists`)
        )
      );
    }
  }

  public async postCollab(r: R, h: H): Promise<Lf.ReturnValue> {
    const collabData = checkData<TCollabDTO>(
      r.payload,
      this.validator.postCollab
    );
    const id = this.authorizationService.getUserIdFromRequest(r);
    const playlist = await checkIsExist<TPlaylist>(
      `Playlist with id ${collabData.playlistId} not found`,
      () => this.playlistService.getById(collabData.playlistId)
    );
    await this.deleteCacheForAllCollaborators(collabData.playlistId);
    await this.cacheService.del(`user:${id}:playlists`);
    await checkIsExist<TUser>(
      `User with id ${collabData.userId} not found`,
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
    await this.deleteCacheForAllCollaborators(collabData.playlistId);
    await this.cacheService.del(`user:${id}:playlists`);
    const playlist = await checkIsExist<TPlaylist>(
      `Playlist with id ${collabData.playlistId} not found`,
      () => this.playlistService.getById(collabData.playlistId)
    );
    this.authorizationService.ensureOwnerShip(id, playlist);
    const collab = await this.collabService.removeCollab(collabData);

    const response = this.presentationService.deleteCollab(collab);
    return h.response(response).code(200);
  }
}

export default CollabHandler;
