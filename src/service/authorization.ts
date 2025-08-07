import type { Request as R } from '@hapi/hapi';
import type { IAuthorizationService } from '../types/authorization.js';
import type { TAuthObj } from '../types/auth.js';
import { NotFoundError, UnauthorizedError } from '../exception.js';
import type { IPlayListService, TPLaylist } from '../types/playlist.js';
import type { ICollabService } from '../types/collab.js';

class AuthorizationService implements IAuthorizationService {
  private playlistService: IPlayListService;
  private collabService: ICollabService;

  constructor(
    playlistService: IPlayListService,
    collabService: ICollabService
  ) {
    this.playlistService = playlistService;
    this.collabService = collabService;
  }

  private async ensureOwner(
    userId: string,
    playlist: TPLaylist
  ): Promise<boolean> {
    if (playlist.owner !== userId) {
      return false;
    }
    return true;
  }

  private async ensureCollaborator(
    userId: string,
    playlistId: string
  ): Promise<boolean> {
    const collab = await this.collabService.getUserIdByPlaylistId(playlistId);
    if (!collab || !collab.includes(userId)) {
      return false;
    }
    return true;
  }

  public getUserIdFromRequest(r: R): string {
    const user = r.auth.credentials.user as TAuthObj;
    if (!user || !user.id) {
      throw new UnauthorizedError('User not authenticated');
    }
    return user.id;
  }

  public async assertPlaylistAccess(
    userId: string,
    playlistId: string,
    onNotFound: (id: string) => Error = (id) =>
      new NotFoundError(`Playlist with id ${id} not found`)
  ): Promise<TPLaylist> {
    const playlist = await this.playlistService.getById(playlistId);

    if (!playlist) {
      throw onNotFound(playlistId);
    }
    const isOwner = await this.ensureOwner(userId, playlist);
    if (isOwner) {
      return playlist;
    }
    const isCollaborator = await this.ensureCollaborator(userId, playlistId);

    if (isCollaborator) {
      return playlist;
    }
    throw new UnauthorizedError(
      `User with id ${userId} does not have access to playlist with id ${playlistId}`
    );
  }
}

export default AuthorizationService;
