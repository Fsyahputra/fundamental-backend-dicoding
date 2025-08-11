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
import type { IServiceSong, Song, TSongPresentation } from './songs.js';
import type { IAlbumLikesService } from './albumLikes.js';
import type { IAuthorizationService } from './authorization.js';

export interface IServiceAlbum {
  save: (album: AlbumDTO) => Promise<Album>;
  getById: (id: string) => Promise<Album | null>;
  delete: (id: string) => Promise<Album | null>;
  update: (id: string, album: Partial<AlbumDTO>) => Promise<Album | null>;
  addLikes: (id: string) => Promise<Album | null>;
  removeLikes: (id: string) => Promise<Album | null>;
}

export interface IAlbumHandler {
  getAlbumById: (r: R, h: H) => Promise<Lf.ReturnValue>;
  postAlbum: (r: R, h: H) => Promise<Lf.ReturnValue>;
  putAlbum: (r: R, h: H) => Promise<Lf.ReturnValue>;
  deleteAlbum: (r: R, h: H) => Promise<Lf.ReturnValue>;
  postLike: (r: R, h: H) => Promise<Lf.ReturnValue>;
  deleteLike: (r: R, h: H) => Promise<Lf.ReturnValue>;
  postCover: (r: R, h: H) => Promise<Lf.ReturnValue>;
  getLikeCount: (r: R, h: H) => Promise<Lf.ReturnValue>;
}

export type TGetAlbumByIdPresentation = {
  album: Omit<Album, 'likesCount'> & {
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
  postLike: (album: Album) => TMessageResponse;
  deleteLike: (album: Album) => TMessageResponse;
  postCover: (album: Album) => TMessageResponse;
  getLikeCount: (likes: number) => Promise<TDataResponse<{ likes: number }>>;
}

export type AlbumDTO = {
  name: string;
  year: number;
  likesCount: number;
  coverUrl: string | null;
};

export type Album = AlbumDTO & {
  id: string;
};

export interface TAlbumSchema extends TSchemaObject<AlbumDTO> {}

export type TAlbumDeps = {
  albumService: IServiceAlbum;
  songService: IServiceSong;
  albumPresentation: IAlbumPresentation;
  albumLikesService: IAlbumLikesService;
  authorizationService: IAuthorizationService;
  validator: TAlbumSchema;
};
