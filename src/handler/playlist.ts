import type {
  IPlaylistHandler,
  IPlayListService,
  TPLaylist,
  TPlaylistDTO,
  TPlaylistServiceDependency,
} from '../types/playlist.js';
import validationObj from '../schema/playlists.js';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../exception.js';
import type { TResponse } from '../types/shared.js';
import type {
  Request as R,
  ResponseToolkit as H,
  Lifecycle as Lf,
} from '@hapi/hapi';
import type { TAuthObj } from '../types/auth.js';
import type { ICollabService } from '../types/collab.js';
import autoBind from 'auto-bind';
import type { IPlaylistServiceCoord } from '../types/musicCoord.js';
import type {
  IActivityService,
  TActivity,
  TActivityPresentation,
} from '../types/activity.js';
import type { IServiceSong } from '../types/songs.js';
import type { IUserService } from '../types/users.js';
import { checkData } from '../utils.js';
import type { IAuthorizationService } from '../types/authorization.js';

class PlaylistHandler implements IPlaylistHandler {
  private validator = validationObj;
  private playlistService: IPlayListService;
  private collaborativePlaylistService: ICollabService;
  private musicService: IPlaylistServiceCoord;
  private activityService: IActivityService;
  private songService: IServiceSong;
  private userService: IUserService;
  private authorizationService: IAuthorizationService;

  constructor(playlistDependency: TPlaylistServiceDependency) {
    this.playlistService = playlistDependency.playlistService;
    this.collaborativePlaylistService =
      playlistDependency.collaborativePlaylistService;
    this.musicService = playlistDependency.musicService;
    this.activityService = playlistDependency.activityService;
    this.songService = playlistDependency.songService;
    this.userService = playlistDependency.userService;
    this.authorizationService = playlistDependency.authorizationService;

    autoBind(this);
  }

  private async assertPlaylistAccess(
    playlistId: string,
    userId: string,
    onNotFound: (id: string) => Error
  ): Promise<TPLaylist> {
    const playlist = await this.playlistService.getById(playlistId);
    if (!playlist) {
      throw onNotFound(playlistId);
    }
    await this.ensureOwnerOrCollaborator(playlistId, userId);
    return playlist;
  }

  private async ensureOwnerOrCollaborator(
    playlistId: string,
    userId: string
  ): Promise<void> {
    const playlist = await this.playlistService.getById(playlistId);
    if (!playlist) {
      throw new NotFoundError(`Playlist with id ${playlistId} not found`);
    }
    const collaboratorIds =
      (await this.collaborativePlaylistService.getUserIdByPlaylistId(
        playlistId
      )) ?? [];
    if (playlist.owner !== userId && !collaboratorIds.includes(userId)) {
      throw new ForbiddenError(
        `You do not have permission to access this playlist`
      );
    }
  }

  private async getAccessiblePlaylistOrNotFound(
    playlistId: string,
    userId: string
  ): Promise<TPLaylist> {
    const playlist = await this.assertPlaylistAccess(
      playlistId,
      userId,
      (id) => new NotFoundError(`Playlist with id ${id} not found`)
    );
    return playlist;
  }

  private async getAccessiblePlaylistOrForbidden(
    playlistId: string,
    userId: string
  ): Promise<TPLaylist> {
    const playlist = await this.assertPlaylistAccess(
      playlistId,
      userId,
      (id) =>
        new ForbiddenError(
          `You do not have permission to access playlist ${id}`
        )
    );
    return playlist;
  }

  public async postPlaylist(r: R, h: H): Promise<Lf.ReturnValue> {
    const { name } = r.payload as { name: string };
    const ownerId = this.authorizationService.getUserIdFromRequest(r);
    const playlistData: TPlaylistDTO = {
      name,
      owner: ownerId,
    };
    checkData(playlistData, this.validator.postSchema);
    const playlist = await this.playlistService.save(playlistData);
    const response: TResponse = {
      status: 'success',
      data: {
        playlistId: playlist.id,
      },
    };
    return h.response(response).code(201);
  }

  public async getPlaylist(r: R, h: H): Promise<Lf.ReturnValue> {
    const ownerId = this.authorizationService.getUserIdFromRequest(r);
    const ownerPlaylists = await this.playlistService.getAll(ownerId);
    const collaborativePlaylists =
      await this.collaborativePlaylistService.getPlaylistIdByUserId(ownerId);
    const ownerPlaylistIds = ownerPlaylists.map((playlist) => playlist.id);
    const userPlaylists = ownerPlaylistIds.concat(collaborativePlaylists);
    const playlists = await this.playlistService.findManyPlaylist(
      userPlaylists
    );
    const ownerIds = playlists.map((playlist) => playlist.owner);
    const accounts = await this.userService.getManyByIds(ownerIds);
    const accountUsernames = new Map(
      accounts.map((account) => [account.id, account.username])
    );
    const mappedPlaylist = playlists.map((playlist) => ({
      id: playlist.id,
      name: playlist.name,
      username: accountUsernames.get(playlist.owner),
    }));
    const response: TResponse = {
      status: 'success',
      data: {
        playlists: mappedPlaylist,
      },
    };
    return h.response(response).code(200);
  }

  public async postSongToPlaylist(r: R, h: H): Promise<Lf.ReturnValue> {
    const playlistId = r.params['id'];
    const { songId } = r.payload as { songId: string };
    const id = this.authorizationService.getUserIdFromRequest(r);
    if (!playlistId || !songId) {
      throw new BadRequestError('Playlist ID and Song ID are required');
    }

    if (typeof playlistId !== 'string' || typeof songId !== 'string') {
      throw new BadRequestError('Playlist ID and Song ID must be strings');
    }
    await this.getAccessiblePlaylistOrNotFound(playlistId, id);
    await this.musicService.addSongToPlaylist(playlistId, songId);
    await this.activityService.addActivity({
      userId: id,
      playlistId,
      songId,
      action: 'add',
    });

    const response: TResponse = {
      status: 'success',
      message: `Song with id ${songId} added to playlist with id ${playlistId}`,
    };
    return h.response(response).code(201);
  }

  public async getSongsByPlaylistId(r: R, h: H): Promise<Lf.ReturnValue> {
    const playlistId = r.params['id'];
    const userId = this.authorizationService.getUserIdFromRequest(r);
    const playlist = await this.getAccessiblePlaylistOrNotFound(
      playlistId,
      userId
    );
    const ownerAccount = await this.userService.getById(playlist.owner);
    if (!ownerAccount) {
      throw new NotFoundError(`Owner with id ${playlist.owner} not found`);
    }
    const username = ownerAccount.username;
    const playlistSongs = await this.musicService.getSongsInPlaylist(
      playlistId
    );
    const songs = playlistSongs.map((playlistSong) => ({
      id: playlistSong.song.id,
      title: playlistSong.song.title,
      performer: playlistSong.song.performer,
    }));
    const response: TResponse = {
      status: 'success',
      data: {
        playlist: {
          id: playlist.id,
          name: playlist.name,
          username: username,
          songs,
        },
      },
    };
    return h.response(response).code(200);
  }

  public async deletePlaylistById(r: R, h: H): Promise<Lf.ReturnValue> {
    const playlistId = r.params['id'];

    const { id } = r.auth.credentials.user as TAuthObj;
    const playlist = await this.playlistService.getById(playlistId);
    if (!playlist) {
      throw new ForbiddenError(`Playlist with id ${playlistId} not found`);
    }

    if (playlist.owner !== id) {
      throw new ForbiddenError(
        `You do not have permission to delete this playlist`
      );
    }

    await this.playlistService.delete(playlistId);
    const response: TResponse = {
      status: 'success',
      message: `Playlist with id ${playlistId} deleted successfully`,
    };
    return h.response(response).code(200);
  }

  public async deleteSongFromPlaylistId(r: R, h: H): Promise<Lf.ReturnValue> {
    const playlistId = r.params['id'];
    const { songId } = r.payload as { songId: string };
    const userId = this.authorizationService.getUserIdFromRequest(r);
    await this.getAccessiblePlaylistOrForbidden(playlistId, userId);

    await this.musicService.removeSongFromPlaylist(playlistId, songId);
    await this.activityService.addActivity({
      userId,
      playlistId,
      songId,
      action: 'delete',
    });
    const response: TResponse = {
      status: 'success',
      message: `Song with id ${songId} removed from playlist with id ${playlistId}`,
    };
    return h.response(response).code(200);
  }

  private async prepareActivityPresentation(
    activity: TActivity,
    r: R
  ): Promise<TActivityPresentation> {
    const username = (r.auth.credentials.user as TAuthObj).username;
    const { title } = await this.songService.getById(activity.songId);
    return {
      username,
      title,
      action: activity.action,
      time: activity.time.toISOString(),
    };
  }

  public async getPlaylistActivity(r: R, h: H): Promise<Lf.ReturnValue> {
    const playlistId = r.params['id'];
    const activities = await this.activityService.getActivitiesByPlaylistId(
      playlistId
    );
    const activityPresentations = await Promise.all(
      activities.map((activity) =>
        this.prepareActivityPresentation(activity, r)
      )
    );
    if (activityPresentations.length === 0) {
      throw new NotFoundError(
        `No activities found for playlist with id ${playlistId}`
      );
    }
    const userId = this.authorizationService.getUserIdFromRequest(r);
    await this.getAccessiblePlaylistOrForbidden(playlistId, userId);
    const response: TResponse = {
      status: 'success',
      data: {
        playlistId,
        activities: activityPresentations,
      },
    };
    return h.response(response).code(200);
  }
}

export default PlaylistHandler;
