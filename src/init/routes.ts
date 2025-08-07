import albumRoutes from "../routes/album.js";
import handlers from "./handler.js";
import collabRoutes from "../routes/collab.js";
import playlistRoutes from "../routes/playlist.js";
import songRoutes from "../routes/songs.js";
import userRoutes from "../routes/user.js";

const album = albumRoutes(handlers.albumHandler);
const collab = collabRoutes(handlers.collabHandler);
const playlist = playlistRoutes(handlers.playlistHandler);
const song = songRoutes(handlers.songHandler);
const user = userRoutes(handlers.userHandler);

const routes = {
  album,
  collab,
  playlist,
  song,
  user,
};

export default routes;
