import AlbumPresentation from '../presentation/album.js';
import CollabPresentation from '../presentation/collab.js';

const album = new AlbumPresentation();
const collab = new CollabPresentation();

const presentationObject = {
  album: album,
  collab: collab,
};
export default presentationObject;
