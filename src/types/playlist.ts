import type { IActivityService } from "./activity.js";
import type { ICollabService } from "./collab.js";
import type { IPlaylistServiceCoord } from "./musicCoord.js";
import type { IServiceSong, Song } from "./songs.js";
import type { Request as R, ResponseToolkit as H, Lifecycle as Lf } from "@hapi/hapi";
import type { IUserService } from "./users.js";

export type TPlaylistDTO = {
  name: string;
  owner: string;
};

export type TPLaylist = TPlaylistDTO & {
  id: string;
};

export type TPlaylistSong = {
  playlist: TPLaylist;
  songs: Song[];
};

export type TPlaylistServiceDependency = {
  playlistService: IPlayListService;
  collaborativePlaylistService: ICollabService;
  musicService: IPlaylistServiceCoord;
  activityService: IActivityService;
  songService: IServiceSong;
  userService: IUserService; // Optional, if needed for user-related operations
};

export interface IPlayListService {
  save: (playList: TPlaylistDTO) => Promise<TPLaylist>;
  getAll: (owner: string) => Promise<TPLaylist[]>;
  delete: (id: string) => Promise<TPLaylist>;
  getById: (id: string) => Promise<TPLaylist | null>;
  savePlaylistSong: (playlistId: string, songId: string) => Promise<TJPlaylistSongs>;
  deletePlaylistSong: (playlistId: string, songId: string) => Promise<void>;
  findManyPlaylist: (ids: string[]) => Promise<TPLaylist[]>;
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
