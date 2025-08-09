import type {
  IPlaylistHandler,
  IPlaylistPresentation,
  IPlayListService,
  // TPlaylist,
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
import type { IPlaylistServiceCoord } from '../types/musicCoord.js';
import type {
  IActivityService,
  TActivity,
  TActivityPresentation,
} from '../types/activity.js';
import type { IServiceSong } from '../types/songs.js';
import type { IUserService } from '../types/users.js';
import { checkData, checkIsExist } from '../utils.js';
import type { IAuthorizationService } from '../types/authorization.js';

class PlaylistHandler implements IPlaylistHandler {
  private validator = validationObj;
  private playlist: IPlayListService;
  private collaborative: ICollabService;
  private music: IPlaylistServiceCoord;
  private activity: IActivityService;
  private song: IServiceSong;
  private user: IUserService;
  private authorization: IAuthorizationService;
  private presentationService: IPlaylistPresentation;

  constructor(deps: TPlaylistServiceDependency) {
    this.playlist = deps.playlistService;
    this.collaborative = deps.collaborativePlaylistService;
    this.music = deps.musicService;
    this.activity = deps.activityService;
    this.song = deps.songService;
    this.user = deps.userService;
    this.authorization = deps.authorizationService;
    this.presentationService = deps.presentationService;
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
    const response = this.presentationService.postPlaylist(playlist);
    return h.response(response).code(201);
  }

  public async getPlaylist(r: R, h: H): Promise<Lf.ReturnValue> {
    const ownerId = this.authorization.getUserIdFromRequest(r);
    const ids = await this.getUserPlaylistIds(ownerId);
    const playlists = await this.playlist.findManyPlaylist(ids);
    const usernames = await this.getPlaylistOwnerUsername(playlists);
    const response = this.presentationService.getPlaylist(playlists, usernames);
    return h.response(response).code(200);
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
    const playlistSongs = await this.music.getSongsInPlaylist(playlistId);
    const songs = playlistSongs.map((playlistSong) => ({
      id: playlistSong.song.id,
      title: playlistSong.song.title,
      performer: playlistSong.song.performer,
    }));
    const response = this.presentationService.getSongsbyPlaylistId();
    return h.response(response).code(200);
  }

  public async deletePlaylistById(r: R, h: H): Promise<Lf.ReturnValue> {
    const playlistId = r.params['id'];
    const userId = this.authorization.getUserIdFromRequest(r);
    await this.authorization.assertDeletePlaylistAccess(userId, playlistId);
    await this.playlist.delete(playlistId);
    const response: TResponse = {
      status: 'success',
      message: `Playlist with id ${playlistId} deleted successfully`,
    };
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
    return h.response(response).code(200);
  }

  private async prepareActivityPresentation(
    activity: TActivity,
    r: R
  ): Promise<TActivityPresentation> {
    const username = this.authorization.getUsernameFromRequest(r);
    const { title } = await this.song.getById(activity.songId);
    return {
      username,
      title,
      action: activity.action,
      time: activity.time.toISOString(),
    };
  }

  public async getPlaylistActivity(r: R, h: H): Promise<Lf.ReturnValue> {
    const playlistId = r.params['id'];
    const activities = await this.activity.getActivitiesByPlaylistId(
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
    const userId = this.authorization.getUserIdFromRequest(r);
    await this.authorization.assertCollabPlaylistAccess(
      userId,
      playlistId,
      (id) => new ForbiddenError(`Playlist with id ${id} not found`)
    );
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
