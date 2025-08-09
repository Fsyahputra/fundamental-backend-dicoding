import type { Request as R } from '@hapi/hapi';
import type { TPlaylist } from './playlist.js';

export interface IAuthorizationService {
  getUserIdFromRequest: (r: R) => string;
  getUsernameFromRequest: (r: R) => string;
  assertCollabPlaylistAccess: (
    userId: string,
    playlistId: string,
    onNotFount?: (id: string) => Error
  ) => Promise<TPlaylist>;
  assertDeletePlaylistAccess(userId: string, playlistId: string): Promise<void>;
  ensureOwnerShip(userId: string, playlist: TPlaylist): void;
  ensureCollaboration(userId: string, playlistId: string): Promise<void>;
}
