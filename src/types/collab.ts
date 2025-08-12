import type {
  Request as R,
  ResponseToolkit as H,
  Lifecycle as Lf,
} from '@hapi/hapi';
import type { TDataResponse, TMessageResponse } from './shared.js';
import type { ICacheService } from './cache.js';
import type { IAuthorizationService } from './authorization.js';
import type { IPlayListService } from './playlist.js';
import type { IUserService } from './users.js';

export type TCollabDTO = {
  playlistId: string;
  userId: string;
};

export type TCollab = TCollabDTO & {
  id: string;
};

export interface ICollabService {
  addCollab: (collab: TCollabDTO) => Promise<TCollab>;
  removeCollab: (collab: TCollabDTO) => Promise<TCollab>;
  getPlaylistIdByUserId: (userId: string) => Promise<string[]>;
  getUserIdByPlaylistId: (playlistId: string) => Promise<string[] | null>;
}

export interface ICollabhandler {
  postCollab: (r: R, h: H) => Promise<Lf.ReturnValue>;
  deleteCollab: (r: R, h: H) => Promise<Lf.ReturnValue>;
}

export type TPostCollabPresentation = {
  collaborationId: string;
};

export interface ICollabPresentation {
  postCollab: (collab: TCollab) => TDataResponse<TPostCollabPresentation>;
  deleteCollab: (collab: TCollab) => TMessageResponse;
}

export type TCollabServiceDependency = {
  collabService: ICollabService;
  userService: IUserService;
  playlistService: IPlayListService;
  authorizationService: IAuthorizationService;
  presentationService: ICollabPresentation;
  cacheService: ICacheService;
};
