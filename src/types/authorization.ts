import type { Request as R } from '@hapi/hapi';
import type { TPLaylist } from './playlist.js';

export interface IAuthorizationService {
  getUserIdFromRequest: (r: R) => string;
  assertCollabPlaylistAccess: (
    userId: string,
    playlistId: string,
    onNotFount?: (id: string) => Error
  ) => Promise<TPLaylist>;
  assertDeletePlaylistAccess(userId: string, playlistId: string): Promise<void>;
  ensureOwnerShip(userId: string, playlist: TPLaylist): void;
  ensureCollaboration(userId: string, playlistId: string): Promise<void>;
}
