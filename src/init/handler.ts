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
import type { TCollabServiceDependency } from '../types/collab.js';

const playListDeps: TPlaylistServiceDependency = {
  activityService: serviceObject.activityService,
  playlistService: serviceObject.playlistService,
  collaborativePlaylistService: serviceObject.collabService,
  musicService: serviceObject.musicCoordService,
  userService: serviceObject.userService,
  authorizationService: serviceObject.authorizationService,
  presentationService: presentationObject.playList,
  cacheService: serviceObject.cacheService,
};

const albumDeps: TAlbumDeps = {
  albumService: serviceObject.albumService,
  songService: serviceObject.songService,
  albumLikesService: serviceObject.albumLikesService,
  albumPresentation: presentationObject.album,
  authorizationService: serviceObject.authorizationService,
  validator: albumValidation,
  coverService: serviceObject.coverService,
  cacheService: serviceObject.cacheService,
};

const collabDeps: TCollabServiceDependency = {
  collabService: serviceObject.collabService,
  userService: serviceObject.userService,
  playlistService: serviceObject.playlistService,
  authorizationService: serviceObject.authorizationService,
  presentationService: presentationObject.collab,
  cacheService: serviceObject.cacheService,
};

const albumHandler = new AlbumHandler(albumDeps);
const collabHandler = new CollabHandler(collabDeps);

const playlistHandler = new PlaylistHandler(playListDeps);
const songHandler = new SongHandler(
  serviceObject.songService,
  songValidation,
  presentationObject.song,
  serviceObject.cacheService
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
