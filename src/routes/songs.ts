import type { ServerRoute } from "@hapi/hapi";
import type { ISongHandler } from "../types/songs.ts";

const base: string = "/songs";

const songRoutes = (handler: ISongHandler): ServerRoute[] => [
  {
    method: "GET",
    path: `${base}/{id}`,
    handler: handler.getSongById,
    options: {
      auth: false,
    },
  },
  {
    method: "POST",
    path: base,
    handler: handler.postSong,
    options: {
      auth: false,
    },
  },
  {
    method: "PUT",
    path: `${base}/{id}`,
    handler: handler.putSong,
    options: {
      auth: false,
    },
  },
  {
    method: "DELETE",
    path: `${base}/{id}`,
    handler: handler.deleteSong,
    options: {
      auth: false,
    },
  },
  {
    method: "GET",
    path: base,
    handler: handler.getSongs,
    options: {
      auth: false,
    },
  },
];

export default songRoutes;
