import type { ServerRoute } from "@hapi/hapi";
import type { IAlbumHandler } from "../types/albums.ts";

const base: string = "/albums";

const albumRoutes = (handler: IAlbumHandler): ServerRoute[] => [
  {
    method: "GET",
    path: `${base}/{id}`,
    handler: handler.getAlbumByid,
    options: {
      auth: false,
    },
  },
  {
    method: "POST",
    path: base,
    handler: handler.postAlbum,
    options: {
      auth: false,
    },
  },
  {
    method: "PUT",
    path: `${base}/{id}`,
    handler: handler.putAlbum,
    options: {
      auth: false,
    },
  },
  {
    method: "DELETE",
    path: `${base}/{id}`,
    handler: handler.deleteAlbum,
    options: {
      auth: false,
    },
  },
];

export default albumRoutes;
