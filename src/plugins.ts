import type { Plugin, ServerRoute } from "@hapi/hapi";
import routes from "./init/routes.js";
import serviceObject from "./init/service.js";
const generatePlugin = (name: string, version: string, routes: ServerRoute[]): Plugin<any> => {
  return {
    name,
    version,
    register: async (server) => {
      server.route(routes);
    },
  };
};

const albumPlugin = generatePlugin("album", "1.0.0", routes.album);
const songsPlugin = generatePlugin("songs", "1.0.0", routes.song);
const collabPlugin = generatePlugin("collab", "1.0.0", routes.collab);
const playlistPlugin = generatePlugin("playlist", "1.0.0", routes.playlist);
const userPlugin = generatePlugin("user", "1.0.0", routes.user);
const jwtPlugin: Plugin<any> = {
  name: "jwt",
  version: "1.0.0",
  register: async (server, _options) => {
    server.auth.scheme("customJwt", () => serviceObject.jwtAuthScheme.getAuthScheme());
    server.auth.strategy("jwt", "customJwt");
    server.auth.default("jwt");
  },
};

const plugins: Plugin<any>[] = [jwtPlugin, albumPlugin, songsPlugin, collabPlugin, playlistPlugin, userPlugin];

export default plugins;
