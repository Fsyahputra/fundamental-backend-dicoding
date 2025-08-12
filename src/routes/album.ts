import type { ServerRoute } from '@hapi/hapi';
import type { IAlbumHandler } from '../types/albums.ts';

const base: string = '/albums';

const albumRoutes = (handler: IAlbumHandler): ServerRoute[] => [
  {
    method: 'GET',
    path: `${base}/{id}`,
    handler: handler.getAlbumById,
    options: {
      auth: false,
    },
  },
  {
    method: 'POST',
    path: base,
    handler: handler.postAlbum,
    options: {
      auth: false,
    },
  },
  {
    method: 'PUT',
    path: `${base}/{id}`,
    handler: handler.putAlbum,
    options: {
      auth: false,
    },
  },
  {
    method: 'DELETE',
    path: `${base}/{id}`,
    handler: handler.deleteAlbum,
    options: {
      auth: false,
    },
  },
  {
    method: 'POST',
    path: `${base}/{id}/covers`,
    handler: handler.postCover,
    options: {
      auth: false,
      payload: {
        allow: 'multipart/form-data',
        output: 'stream',
        multipart: true,
        parse: true,
      },
    },
  },
  {
    method: 'GET',
    path: `${base}/{id}/likes`,
    handler: handler.getLikeCount,
    options: {
      auth: false,
    },
  },
  {
    method: 'POST',
    path: `${base}/{id}/likes`,
    handler: handler.postLike,
    options: {
      auth: 'jwt',
    },
  },
  {
    method: 'DELETE',
    path: `${base}/{id}/likes`,
    handler: handler.deleteLike,
    options: {
      auth: 'jwt',
    },
  },
  {
    method: 'GET',
    path: `${base}/{id}/covers`,
    handler: handler.getCoverById,
    options: {
      auth: false,
    },
  },
];

export default albumRoutes;
