import type { TSchemaObject } from './shared.js';
import type {
  Request as R,
  ResponseToolkit as H,
  Lifecycle as Lf,
} from '@hapi/hapi';

export interface IServiceAlbum {
  save: (album: AlbumDTO) => Promise<Album>;
  getById: (id: string) => Promise<Album | null>;
  delete: (id: string) => Promise<Album | null>;
  update: (id: string, album: Partial<AlbumDTO>) => Promise<Album | null>;
}

export interface IAlbumHandler {
  getAlbumByid: (r: R, h: H) => Promise<Lf.ReturnValue>;
  postAlbum: (r: R, h: H) => Promise<Lf.ReturnValue>;
  putAlbum: (r: R, h: H) => Promise<Lf.ReturnValue>;
  deleteAlbum: (r: R, h: H) => Promise<Lf.ReturnValue>;
}

export type AlbumDTO = {
  name: string;
  year: number;
};

export type Album = AlbumDTO & {
  id: string;
};

export interface TAlbumSchema extends TSchemaObject<AlbumDTO> {}
