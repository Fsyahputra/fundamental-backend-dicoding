import AlbumHandler from '../handler/albums.js';
import serviceObject from './service.js';
import albumValidation from '../schema/album.js';
import songValidation from '../schema/song.js';
import CollabHandler from '../handler/collab.js';
import PlaylistHandler from '../handler/playlist.js';
import type { TPlaylistServiceDependency } from '../types/playlist.js';
import SongHandler from '../handler/songs.js';
import UserHandler from '../handler/user.js';
import presentationObject from './presentation.js';
import type { TAlbumDeps } from '../types/albums.js';

const playListDeps: TPlaylistServiceDependency = {
  activityService: serviceObject.activityService,
  playlistService: serviceObject.playlistService,
  collaborativePlaylistService: serviceObject.collabService,
  musicService: serviceObject.musicCoordService,
  userService: serviceObject.userService,
  authorizationService: serviceObject.authorizationService,
  presentationService: presentationObject.playList,
};

const albumDeps: TAlbumDeps = {
  albumService: serviceObject.albumService,
  songService: serviceObject.songService,
  albumLikesService: serviceObject.albumLikesService,
  albumPresentation: presentationObject.album,
  authorizationService: serviceObject.authorizationService,
  validator: albumValidation,
  coverService: serviceObject.coverService,
};

const albumHandler = new AlbumHandler(albumDeps);
const collabHandler = new CollabHandler(
  serviceObject.collabService,
  serviceObject.userService,
  serviceObject.playlistService,
  serviceObject.authorizationService,
  presentationObject.collab
);
const playlistHandler = new PlaylistHandler(playListDeps);
const songHandler = new SongHandler(
  serviceObject.songService,
  songValidation,
  presentationObject.song
);
const userHandler = new UserHandler(
  serviceObject.userService,
  serviceObject.authService,
  presentationObject.user
);

const handlers = {
  albumHandler,
  collabHandler,
  playlistHandler,
  songHandler,
  userHandler,
};

export default handlers;
