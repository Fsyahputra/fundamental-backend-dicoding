import type { Request as R } from '@hapi/hapi';
import type { TPLaylist } from './playlist.js';

export interface IAuthorizationService {
  getUserIdFromRequest: (r: R) => string;
  assertPlaylistAccess: (
    userId: string,
    playlistId: string,
    onNotFount?: (id: string) => Error
  ) => Promise<TPLaylist>;
}
