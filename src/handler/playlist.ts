import type {
  IPlaylistHandler,
  IPlaylistPresentation,
  IPlayListService,
  TPlaylist,
  TPlaylistDTO,
  TPlaylistServiceDependency,
} from '../types/playlist.js';
import validationObj from '../schema/playlists.js';
import { ForbiddenError, NotFoundError } from '../exception.js';
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

  public async postPlaylist(r: R, h: H): Promise<Lf.ReturnValue> {
    const { name } = r.payload as { name: string };
    const ownerId = this.authorization.getUserIdFromRequest(r);
    const playlistData = checkData<TPlaylistDTO>(
      { name, owner: ownerId },
      this.validator.postSchema
    );
    const playlist = await this.playlist.save(playlistData);
    await this.cacheService.del(`user:${ownerId}:playlists`);
    // .log(
    //   `Key user:${ownerId}:playlists deleted from cache after creating playlist ${playlist.id}`
    // );
    const response = this.presentationService.postPlaylist(playlist);
    return h.response(response).code(201);
  }

  public async getPlaylist(r: R, h: H): Promise<Lf.ReturnValue> {
    const ownerId = this.authorization.getUserIdFromRequest(r);
    const ids = await this.getUserPlaylistIds(ownerId);
    const { data: playlists, fromCache } = await fetchFromCacheOrDefault<
      TPlaylist[]
    >(`user:${ownerId}:playlists`, this.cacheService, () =>
      this.playlist.findManyPlaylist(ids)
    );
    // .log(
    //   `Key user:${ownerId}:playlists fetched from ${
    //     fromCache ? 'cache' : 'database'
    //   }`
    // );
    // const playlists = await this.playlist.findManyPlaylist(ids);
    const usernames = await this.getPlaylistOwnerUsername(playlists);

    const response = this.presentationService.getPlaylist(playlists, usernames);
    const res = h.response(response);
    res.header('X-Data-source', fromCache ? 'cache' : '');
    return res.code(200);
  }

  public async postSongToPlaylist(r: R, h: H): Promise<Lf.ReturnValue> {
    const playlistId = r.params['id'];
    const { songId } = r.payload as { songId: string };
    const id = this.authorization.getUserIdFromRequest(r);
    checkData({ playlistId, songId }, this.validator.postSongToPlaylistSchema);
    await this.authorization.assertCollabPlaylistAccess(
      id,
      playlistId,
      (id) => new NotFoundError(`Playlist with id ${id} not found`)
    );
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
    await this.cacheService.del(`playlist:${playlistId}:songs`);
    // .log(
    //   `Key playlist:${playlistId}:songs deleted from cache after adding song ${songId}`
    // );
    return h.response(response).code(201);
  }

  public async getSongsByPlaylistId(r: R, h: H): Promise<Lf.ReturnValue> {
    const playlistId = r.params['id'];
    const userId = this.authorization.getUserIdFromRequest(r);
    const playlist = await this.authorization.assertCollabPlaylistAccess(
      userId,
      playlistId,
      (id) => new NotFoundError(`Playlist with id ${id} not found`)
    );
    const { username } = await checkIsExist('Owner account not found', () =>
      this.user.getById(playlist.owner)
    );

    const { data, fromCache } = await fetchFromCacheOrDefault<
      PlaylistSong<Song>[]
    >(`playlist:${playlistId}:songs`, this.cacheService, () =>
      this.music.getSongsInPlaylist(playlistId)
    );
    // .log(
    //   `Key playlist:${playlistId}:songs fetched from ${
    //     fromCache ? 'cache' : 'database'
    //   }`
    // );
    const response = this.presentationService.getSongsbyPlaylistId(
      data,
      username
    );

    const res = h.response(response);
    res.header('X-Data-source', fromCache ? 'cache' : '');
    return res.code(200);
  }

  public async deletePlaylistById(r: R, h: H): Promise<Lf.ReturnValue> {
    const playlistId = r.params['id'];
    const userId = this.authorization.getUserIdFromRequest(r);
    await this.authorization.assertDeletePlaylistAccess(userId, playlistId);
    const playList = await this.playlist.delete(playlistId);
    const response = this.presentationService.deletePlaylistById(playList);
    await this.cacheService.del(`user:${userId}:playlists`);
    // .log(
    //   `Key user:${userId}:playlists deleted from cache after deleting playlist ${playlistId}`
    // );
    return h.response(response).code(200);
  }

  public async deleteSongFromPlaylistId(r: R, h: H): Promise<Lf.ReturnValue> {
    const playlistId = r.params['id'];
    const { songId } = r.payload as { songId: string };
    const userId = this.authorization.getUserIdFromRequest(r);
    await this.authorization.assertCollabPlaylistAccess(
      userId,
      playlistId,
      (id) => new ForbiddenError(`Playlist with id ${id} not found`)
    );
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
    await this.cacheService.del(`playlist:${playlistId}:songs`);
    // .log(
    //   `Key playlist:${playlistId}:songs deleted from cache after deleting song ${songId}`
    // );
    return h.response(response).code(200);
  }

  public async getPlaylistActivity(r: R, h: H): Promise<Lf.ReturnValue> {
    const playlistId = r.params['id'];
    const activities = await this.activity.getActivitiesByPlaylistId(
      playlistId
    );
    const response = await this.presentationService.getPlaylistActivity(
      activities
    );
    const userId = this.authorization.getUserIdFromRequest(r);
    await this.authorization.assertCollabPlaylistAccess(
      userId,
      playlistId,
      (id) => new ForbiddenError(`Playlist with id ${id} not found`)
    );
    return h.response(response).code(200);
  }

  public async exportPlaylist(r: R, h: H): Promise<Lf.ReturnValue> {
    const playlistId = r.params['id'];
    const { targetEmail } = r.payload as { targetEmail: string };
    const userId = this.authorization.getUserIdFromRequest(r);
    await this.authorization.assertCollabPlaylistAccess(
      userId,
      playlistId,
      (id) => new NotFoundError(`Playlist with id ${id} not found`)
    );
    const playlist = await this.playlist.exportPlaylist(
      targetEmail,
      playlistId
    );
    const response = this.presentationService.exportPlaylist(playlist);
    return h.response(response).code(200);
  }
}

export default PlaylistHandler;
