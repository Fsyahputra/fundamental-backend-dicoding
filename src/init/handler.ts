import AlbumHandler from "../handler/albums.js";
import serviceObject from "./service.js";
import albumValidation from "../schema/album.js";
import songValidation from "../schema/song.js";
import CollabHandler from "../handler/collab.js";
import PlaylistHandler from "../handler/playlist.js";
import type { TPlaylistServiceDependency } from "../types/playlist.js";
import SongHandler from "../handler/songs.js";
import UserHandler from "../handler/user.js";

const playListDeps: TPlaylistServiceDependency = {
  activityService: serviceObject.activityService,
  playlistService: serviceObject.playlistService,
  collaborativePlaylistService: serviceObject.collabService,
  musicService: serviceObject.musicCoordService,
  songService: serviceObject.songService,
  userService: serviceObject.userService, // Optional, if needed for user-related operations
};

const albumHandler = new AlbumHandler(serviceObject.albumService, albumValidation, serviceObject.songService);
const collabHandler = new CollabHandler(serviceObject.collabService, serviceObject.userService, serviceObject.playlistService);
const playlistHandler = new PlaylistHandler(playListDeps);
const songHandler = new SongHandler(serviceObject.songService, songValidation);
const userHandler = new UserHandler(serviceObject.userService, serviceObject.authService);

const handlers = {
  albumHandler,
  collabHandler,
  playlistHandler,
  songHandler,
  userHandler,
};

export default handlers;
