import type { TSchemaObject } from "./shared.js";
import type { Request as R, ResponseToolkit as H, Lifecycle as Lf } from "@hapi/hapi";

export interface IServiceSong {
  save: (song: SongDTO) => Promise<Song>;
  getById: (id: string) => Promise<Song>;
  delete: (id: string) => Promise<Song | null>;
  update: (id: string, song: Partial<SongDTO>) => Promise<Song | null>;
  getAll: () => Promise<Song[]>;
  getByAlbumId(albumId: string): Promise<Song[]>;
  getByQueryParams: (params: queryParams) => Promise<Song[]>;
  getByPlaylistId: (playlistId: string) => Promise<Song[]>;
}

export interface ISongHandler {
  getSongById: (r: R, h: H) => Promise<Lf.ReturnValue>;
  postSong: (r: R, h: H) => Promise<Lf.ReturnValue>;
  putSong: (r: R, h: H) => Promise<Lf.ReturnValue>;
  deleteSong: (r: R, h: H) => Promise<Lf.ReturnValue>;
  getSongs: (r: R, h: H) => Promise<Lf.ReturnValue>;
}

export type queryParams = {
  title?: string;
  performer?: string;
};
export type SongDTO = {
  title: string;
  year: number;
  performer: string;
  genre: string;
  duration?: number | null;
  albumId?: string | null;
};

export type Song = SongDTO & { id: string };

export interface TSongSchema extends TSchemaObject<SongDTO> {}
