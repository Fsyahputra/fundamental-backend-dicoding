import type {
  TDataResponse,
  TMessageResponse,
  TSchemaObject,
} from './shared.js';
import type {
  Request as R,
  ResponseToolkit as H,
  Lifecycle as Lf,
} from '@hapi/hapi';

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

export type TSongPresentation = Omit<Song, 'albumId'>;

export type TGetSongs = {
  id: string;
  title: string;
  performer: string;
};

export type Song = SongDTO & { id: string };

export interface TSongSchema extends TSchemaObject<SongDTO> {}

export interface ISongPresentation {
  getSongById: (song: Song) => TDataResponse<{ song: Song }>;
  postSong: (song: Song) => TDataResponse<{ songId: string }>;
  putSong: (song: Song) => TMessageResponse;
  deleteSong: (song: Song) => TMessageResponse;
  getSongs: (songs: Song[]) => TDataResponse<{ songs: TGetSongs[] }>;
}
