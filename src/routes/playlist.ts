import type { ServerRoute } from '@hapi/hapi';
import type { IPlaylistHandler } from '../types/playlist.js';

const base: string = '/playlists';

const playlistRoutes = (handler: IPlaylistHandler): ServerRoute[] => [
  {
    method: 'POST',
    path: base,
    handler: handler.postPlaylist,
    options: {
      auth: 'jwt',
    },
  },
  {
    method: 'GET',
    path: base,
    handler: handler.getPlaylist,
    options: {
      auth: 'jwt',
    },
  },
  {
    method: 'DELETE',
    path: `${base}/{id}`,
    handler: handler.deletePlaylistById,
    options: {
      auth: 'jwt',
    },
  },
  {
    method: 'POST',
    path: `${base}/{id}/songs`,
    handler: handler.postSongToPlaylist,
    options: {
      auth: 'jwt',
    },
  },
  {
    method: 'GET',
    path: `${base}/{id}/songs`,
    handler: handler.getSongsByPlaylistId,
    options: {
      auth: 'jwt',
    },
  },
  {
    method: 'DELETE',
    path: `${base}/{id}/songs`,
    handler: handler.deleteSongFromPlaylistId,
    options: {
      auth: 'jwt',
    },
  },
  {
    method: 'GET',
    path: `${base}/{id}/activities`,
    handler: handler.getPlaylistActivity,
    options: {
      auth: 'jwt',
    },
  },
  {
    method: 'POST',
    path: '/export/playlist/{id}',
    handler: handler.exportPlaylist,
    options: {
      auth: 'jwt',
    },
  },
];

export default playlistRoutes;
