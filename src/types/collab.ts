import type { Request as R, ResponseToolkit as H, Lifecycle as Lf } from "@hapi/hapi";

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
