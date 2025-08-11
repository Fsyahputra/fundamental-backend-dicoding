import AlbumPresentation from '../presentation/album.js';
import CollabPresentation from '../presentation/collab.js';
import PlaylistPresentation from '../presentation/playlist.js';
import SongPresentation from '../presentation/songs.js';
import UserPresentation from '../presentation/user.js';
import serviceObject from './service.js';

const album = new AlbumPresentation();
const collab = new CollabPresentation();
const song = new SongPresentation();
const user = new UserPresentation();
const playList = new PlaylistPresentation(
  serviceObject.songService,
  serviceObject.userService
);

const presentationObject = {
  album: album,
  collab: collab,
  song: song,
  playList: playList,
  user: user,
};
export default presentationObject;
