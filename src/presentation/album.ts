import type {
  Album,
  IAlbumPresentation,
  TGetAlbumByIdPresentation,
  TPostAlbumPresentation,
} from '../types/albums.js';
import type { TDataResponse, TMessageResponse } from '../types/shared.js';
import type { Song, TSongPresentation } from '../types/songs.js';

class AlbumPresentation implements IAlbumPresentation {
  private mapSongToPresentation(song: Song): TSongPresentation {
    return {
      id: song.id,
      title: song.title,
      year: song.year,
      performer: song.performer,
      genre: song.genre,
      duration: song.duration !== undefined ? song.duration : null,
    };
  }

  public getAlbumById(
    album: Album,
    songs: Song[]
  ): TDataResponse<TGetAlbumByIdPresentation> {
    const mappedSongs = songs.map(this.mapSongToPresentation);
    return {
      status: 'success',
      data: {
        album: {
          ...album,
          songs: mappedSongs,
        },
      },
    };
  }

  public postAlbum(album: Album): TDataResponse<TPostAlbumPresentation> {
    return {
      status: 'success',
      data: {
        albumId: album.id,
      },
    };
  }

  public putAlbum(album: Album): TMessageResponse {
    return {
      status: 'success',
      message: `Album with id ${album.id} updated successfully`,
    };
  }

  public deleteAlbum(album: Album): TMessageResponse {
    return {
      status: 'success',
      message: `Album with id ${album.id} deleted successfully`,
    };
  }
}

export default AlbumPresentation;
