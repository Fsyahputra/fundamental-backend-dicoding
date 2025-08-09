import AlbumPresentation from '../presentation/album.js';
import CollabPresentation from '../presentation/collab.js';
import SongPresentation from '../presentation/songs.js';
import UserPresentation from '../presentation/user.js';

const album = new AlbumPresentation();
const collab = new CollabPresentation();
const song = new SongPresentation();
const user = new UserPresentation();

const presentationObject = {
  album: album,
  collab: collab,
  song: song,
  user: user,
};
export default presentationObject;
