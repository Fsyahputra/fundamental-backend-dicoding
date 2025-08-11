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
import type { Song, TSongPresentation } from './songs.js';

export interface IServiceAlbum {
  save: (album: AlbumDTO) => Promise<Album>;
  getById: (id: string) => Promise<Album | null>;
  delete: (id: string) => Promise<Album | null>;
  update: (id: string, album: Partial<AlbumDTO>) => Promise<Album | null>;
}

export interface IAlbumHandler {
  getAlbumById: (r: R, h: H) => Promise<Lf.ReturnValue>;
  postAlbum: (r: R, h: H) => Promise<Lf.ReturnValue>;
  putAlbum: (r: R, h: H) => Promise<Lf.ReturnValue>;
  deleteAlbum: (r: R, h: H) => Promise<Lf.ReturnValue>;
}

export type TGetAlbumByIdPresentation = {
  album: Album & {
    songs: TSongPresentation[];
  };
};

export type TPostAlbumPresentation = {
  albumId: string;
};

export interface IAlbumPresentation {
  getAlbumById: (
    album: Album,
    songs: Song[]
  ) => TDataResponse<TGetAlbumByIdPresentation>;
  postAlbum: (album: Album) => TDataResponse<TPostAlbumPresentation>;
  putAlbum: (album: Album) => TMessageResponse;
  deleteAlbum: (album: Album) => TMessageResponse;
}

export type AlbumDTO = {
  name: string;
  year: number;
  likes: number;
  cover?: string | null;
};

export type Album = AlbumDTO & {
  id: string;
};

export interface TAlbumSchema extends TSchemaObject<AlbumDTO> {}
