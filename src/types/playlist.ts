import type {
  IActivityService,
  TActivity,
  TActivityPresentation,
} from './activity.js';
import type { ICollabService } from './collab.js';
import type { IPlaylistServiceCoord, PlaylistSong } from './musicCoord.js';
import type { Song, TGetSongs } from './songs.js';
import type {
  Request as R,
  ResponseToolkit as H,
  Lifecycle as Lf,
} from '@hapi/hapi';
import type { IUserService } from './users.js';
import type { IAuthorizationService } from './authorization.js';
import type { TDataResponse, TMessageResponse } from './shared.js';
import type { ICacheService } from './cache.js';

export type TPlaylistDTO = {
  name: string;
  owner: string;
};

export type TPlaylist = TPlaylistDTO & {
  id: string;
};

export type TPlaylistSong = {
  playlist: TPlaylist;
  songs: Song[];
};

export type TPlaylistServiceDependency = {
  playlistService: IPlayListService;
  collaborativePlaylistService: ICollabService;
  musicService: IPlaylistServiceCoord;
  activityService: IActivityService;
  userService: IUserService;
  authorizationService: IAuthorizationService;
  presentationService: IPlaylistPresentation;
  cacheService: ICacheService;
};

export interface IPlayListService {
  save: (playList: TPlaylistDTO) => Promise<TPlaylist>;
  getAll: (owner: string) => Promise<TPlaylist[]>;
  delete: (id: string) => Promise<TPlaylist>;
  getById: (id: string) => Promise<TPlaylist | null>;
  savePlaylistSong: (
    playlistId: string,
    songId: string
  ) => Promise<TJPlaylistSongs>;
  deletePlaylistSong: (playlistId: string, songId: string) => Promise<void>;
  findManyPlaylist: (ids: string[]) => Promise<TPlaylist[]>;
  exportPlaylist: (
    targetEmail: string,
    playlistId: string
  ) => Promise<TPlaylist>;
}

export type TJPlaylistSongs = {
  playlistId: string;
  songId: string;
};

export interface IPlaylistHandler {
  postPlaylist: (r: R, h: H) => Promise<Lf.ReturnValue>;
  getPlaylist: (r: R, h: H) => Promise<Lf.ReturnValue>;
  deletePlaylistById: (r: R, h: H) => Promise<Lf.ReturnValue>;
  postSongToPlaylist: (r: R, h: H) => Promise<Lf.ReturnValue>;
  getSongsByPlaylistId: (r: R, h: H) => Promise<Lf.ReturnValue>;
  deleteSongFromPlaylistId: (r: R, h: H) => Promise<Lf.ReturnValue>;
  getPlaylistActivity(r: R, h: H): Promise<Lf.ReturnValue>;
  exportPlaylist(r: R, h: H): Promise<Lf.ReturnValue>;
}

export type TPlaylistWithOwner = {
  id: string;
  name: string;
  username: string;
};

export interface IPlaylistPresentation {
  postPlaylist: (playlist: TPlaylist) => TDataResponse<{ playlistId: string }>;
  getPlaylist: (
    playlist: TPlaylist[],
    usernames: string[]
  ) => TDataResponse<{ playlists: TPlaylistWithOwner[] }>;
  postSongToPlaylist: (playlist: TPlaylist, song: Song) => TMessageResponse;
  getSongsbyPlaylistId: (
    playlistSong: PlaylistSong<Song>[],
    ownerUsername: string
  ) => TDataResponse<{
    playlist: TPlaylistWithOwner & { songs: TGetSongs[] };
  }>;
  deletePlaylistById: (playlist: TPlaylist) => TMessageResponse;
  deleteSongFromPlaylistId: (
    playlist: TPlaylist,
    song: Song
  ) => TMessageResponse;
  getPlaylistActivity: (activities: TActivity[]) => Promise<
    TDataResponse<{
      playlistId: string;
      activities: TActivityPresentation[];
    }>
  >;
  exportPlaylist: (playlist: TPlaylist) => TMessageResponse;
}

export type TExportPlaylistDTO = {
  targetEmail: string;
};
