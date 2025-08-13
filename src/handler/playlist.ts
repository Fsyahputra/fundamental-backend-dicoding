import type {
  IPlaylistHandler,
  IPlaylistPresentation,
  IPlayListService,
  TPlaylist,
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
import type { ICollabService } from '../types/collab.js';
import autoBind from 'auto-bind';
import type {
  IPlaylistServiceCoord,
  PlaylistSong,
} from '../types/musicCoord.js';
import type { IActivityService } from '../types/activity.js';
import type { IUserService } from '../types/users.js';
import { checkData, checkIsExist, fetchFromCacheOrDefault } from '../utils.js';
import type { IAuthorizationService } from '../types/authorization.js';
import type { ICacheService } from '../types/cache.js';
import type { Song } from '../types/songs.js';
import PLAYLIST from '../constant/playlist.js';

class PlaylistHandler implements IPlaylistHandler {
  private validator = validationObj;
  private playlist: IPlayListService;
  private collaborative: ICollabService;
  private music: IPlaylistServiceCoord;
  private activity: IActivityService;
  private user: IUserService;
  private authorization: IAuthorizationService;
  private presentationService: IPlaylistPresentation;
  private cacheService: ICacheService;

  constructor(deps: TPlaylistServiceDependency) {
    this.playlist = deps.playlistService;
    this.collaborative = deps.collaborativePlaylistService;
    this.music = deps.musicService;
    this.activity = deps.activityService;
    this.user = deps.userService;
    this.authorization = deps.authorizationService;
    this.presentationService = deps.presentationService;
    this.cacheService = deps.cacheService;
    autoBind(this);
  }

  private async getUserPlaylistIds(userId: string): Promise<string[]> {
    const ownerPlaylist = await this.playlist.getAll(userId);
    const collaborativePlaylists =
      await this.collaborative.getPlaylistIdByUserId(userId);
    const ownerPlaylistIds = ownerPlaylist.map((playlist) => playlist.id);
    return ownerPlaylistIds.concat(collaborativePlaylists);
  }

  private async getPlaylistOwnerUsername(
    playlist: TPlaylistDTO[]
  ): Promise<string[]> {
    const users = await this.user.getManyByIds(playlist.map((p) => p.owner));
    const userMap = new Map(users.map((user) => [user.id, user.username]));
    return playlist.map((p) => userMap.get(p.owner) || '');
  }

  private async assertAndNotFound(
    playlistId: string,
    userId: string
  ): Promise<TPlaylist> {
    const playlist = await this.authorization.assertCollabPlaylistAccess(
      userId,
      playlistId,
      (id) =>
        new NotFoundError(PLAYLIST.HANDLER.ERROR_MESSAGES.playlistNotFound(id))
    );
    return playlist;
  }

  private async assertAndForbidden(
    playlistId: string,
    userId: string
  ): Promise<TPlaylist> {
    const playlist = await this.authorization.assertCollabPlaylistAccess(
      userId,
      playlistId,
      (id) =>
        new ForbiddenError(
          PLAYLIST.HANDLER.ERROR_MESSAGES.forbiddenPlaylist(id)
        )
    );
    return playlist;
  }

  private getAlbumIdFromRequest(r: R): string {
    const playlistId = r.params['id'];
    if (!playlistId) {
      throw new BadRequestError(
        PLAYLIST.HANDLER.ERROR_MESSAGES.PLAYLIST_ID_REQUIRED
      );
    }
    return playlistId;
  }

  private fetchPlaylistSongsCacheWithFallback(playlistId: string): Promise<{
    data: PlaylistSong<Song>[];
    fromCache: boolean;
  }> {
    return fetchFromCacheOrDefault<PlaylistSong<Song>[]>(
      PLAYLIST.HANDLER.CACHE_KEYS.playlistSongsCacheKey(playlistId),
      this.cacheService,
      () => this.music.getSongsInPlaylist(playlistId)
    );
  }

  public async postPlaylist(r: R, h: H): Promise<Lf.ReturnValue> {
    const { name } = r.payload as { name: string };
    const ownerId = this.authorization.getUserIdFromRequest(r);
    const playlistData = checkData<TPlaylistDTO>(
      { name, owner: ownerId },
      this.validator.postSchema
    );
    const playlist = await this.playlist.save(playlistData);
    await this.cacheService.del(
      PLAYLIST.HANDLER.CACHE_KEYS.userPlaylistsCacheKey(ownerId)
    );
    const response = this.presentationService.postPlaylist(playlist);
    return h.response(response).code(201);
  }

  public async getPlaylist(r: R, h: H): Promise<Lf.ReturnValue> {
    const ownerId = this.authorization.getUserIdFromRequest(r);
    const ids = await this.getUserPlaylistIds(ownerId);
    const { data: playlists, fromCache } = await fetchFromCacheOrDefault<
      TPlaylist[]
    >(
      PLAYLIST.HANDLER.CACHE_KEYS.userPlaylistsCacheKey(ownerId),
      this.cacheService,
      () => this.playlist.findManyPlaylist(ids)
    );
    const usernames = await this.getPlaylistOwnerUsername(playlists);
    const response = this.presentationService.getPlaylist(playlists, usernames);
    const res = h.response(response);
    res.header('X-Data-source', fromCache ? 'cache' : '');
    return res.code(200);
  }

  public async postSongToPlaylist(r: R, h: H): Promise<Lf.ReturnValue> {
    const playlistId = this.getAlbumIdFromRequest(r);
    const { songId } = r.payload as { songId: string };
    const id = this.authorization.getUserIdFromRequest(r);
    checkData({ playlistId, songId }, this.validator.postSongToPlaylistSchema);
    await this.assertAndNotFound(playlistId, id);
    const playlistSong = await this.music.addSongToPlaylist(playlistId, songId);
    await this.activity.addActivity({
      userId: id,
      playlistId,
      songId,
    });
    const response = this.presentationService.postSongToPlaylist(
      playlistSong.playlist,
      playlistSong.song
    );
    await this.cacheService.del(
      PLAYLIST.HANDLER.CACHE_KEYS.playlistSongsCacheKey(playlistId)
    );
    return h.response(response).code(201);
  }

  public async getSongsByPlaylistId(r: R, h: H): Promise<Lf.ReturnValue> {
    const playlistId = this.getAlbumIdFromRequest(r);
    const userId = this.authorization.getUserIdFromRequest(r);
    const playlist = await this.assertAndNotFound(playlistId, userId);
    const { username } = await checkIsExist(
      PLAYLIST.HANDLER.ERROR_MESSAGES.OWNER_ACCOUNT_NOT_FOUND,
      () => this.user.getById(playlist.owner)
    );
    const { data, fromCache } = await this.fetchPlaylistSongsCacheWithFallback(
      playlistId
    );
    const response = this.presentationService.getSongsbyPlaylistId(
      data,
      username
    );
    const res = h.response(response);
    res.header('X-Data-source', fromCache ? 'cache' : '');
    return res.code(200);
  }

  public async deletePlaylistById(r: R, h: H): Promise<Lf.ReturnValue> {
    const playlistId = this.getAlbumIdFromRequest(r);
    const userId = this.authorization.getUserIdFromRequest(r);
    await this.authorization.assertDeletePlaylistAccess(userId, playlistId);
    const playList = await this.playlist.delete(playlistId);
    const response = this.presentationService.deletePlaylistById(playList);
    await this.cacheService.del(
      PLAYLIST.HANDLER.CACHE_KEYS.userPlaylistsCacheKey(userId)
    );
    return h.response(response).code(200);
  }

  public async deleteSongFromPlaylistId(r: R, h: H): Promise<Lf.ReturnValue> {
    const playlistId = this.getAlbumIdFromRequest(r);
    const { songId } = r.payload as { songId: string };
    const userId = this.authorization.getUserIdFromRequest(r);
    await this.assertAndForbidden(playlistId, userId);
    await this.music.removeSongFromPlaylist(playlistId, songId);
    await this.activity.deleteActivity({
      userId,
      playlistId,
      songId,
    });
    const response: TResponse = {
      status: 'success',
      message: `Song with id ${songId} removed from playlist with id ${playlistId}`,
    };
    await this.cacheService.del(
      PLAYLIST.HANDLER.CACHE_KEYS.playlistSongsCacheKey(playlistId)
    );
    return h.response(response).code(200);
  }

  public async getPlaylistActivity(r: R, h: H): Promise<Lf.ReturnValue> {
    const playlistId = r.params['id'];
    const activities = await this.activity.getActivitiesByPlaylistId(
      playlistId
    );
    if (activities.length === 0) {
      throw new NotFoundError(
        PLAYLIST.HANDLER.ERROR_MESSAGES.ACTIVITIES_NOT_FOUND
      );
    }
    const response = await this.presentationService.getPlaylistActivity(
      activities
    );
    const userId = this.authorization.getUserIdFromRequest(r);
    await this.assertAndForbidden(playlistId, userId);
    return h.response(response).code(200);
  }

  public async exportPlaylist(r: R, h: H): Promise<Lf.ReturnValue> {
    const playlistId = this.getAlbumIdFromRequest(r);
    const { targetEmail } = r.payload as { targetEmail: string };
    if (!targetEmail) {
      throw new BadRequestError(
        PLAYLIST.HANDLER.ERROR_MESSAGES.TARGET_EMAIL_REQUIRED
      );
    }
    const userId = this.authorization.getUserIdFromRequest(r);
    await this.assertAndNotFound(playlistId, userId);
    const playlist = await this.playlist.exportPlaylist(
      targetEmail,
      playlistId
    );
    const response = this.presentationService.exportPlaylist(playlist);
    return h.response(response).code(201);
  }
}

export default PlaylistHandler;
