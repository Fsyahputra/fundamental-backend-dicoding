import type {
  IActivityService,
  TActivity,
  TActivityPresentation,
} from './activity.js';
import type { ICollabService } from './collab.js';
import type { IPlaylistServiceCoord } from './musicCoord.js';
import type { IServiceSong, Song, TGetSongs } from './songs.js';
import type {
  Request as R,
  ResponseToolkit as H,
  Lifecycle as Lf,
} from '@hapi/hapi';
import type { IUserService } from './users.js';
import type { IAuthorizationService } from './authorization.js';
import type { TDataResponse, TMessageResponse } from './shared.js';

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
  songService: IServiceSong;
  userService: IUserService;
  authorizationService: IAuthorizationService;
  presentationService: IPlaylistPresentation;
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
    playlistSong: TPlaylistSong<Song>[],
    ownerUsername: string
  ) => TDataResponse<{
    playlist: TPlaylistWithOwner & { songs: TGetSongs[] };
  }>;
  deletePlaylistById: (playlist: TPlaylist) => TMessageResponse;
  deleteSongFromPlaylistId: (
    playlist: TPlaylist,
    song: Song
  ) => TMessageResponse;
  getPlaylistActivity: (
    activities: TActivity[],
    playlist: TPlaylist,
    usernames: string[],
    titles: string[]
  ) => TDataResponse<{
    playlistId: string;
    activities: TActivityPresentation[];
  }>;
}
