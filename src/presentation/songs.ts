import type { TDataResponse, TMessageResponse } from '../types/shared.js';
import type { ISongPresentation, Song, TGetSongs } from '../types/songs.js';
import SONG from '../constant/songs.js';

class SongPresentation implements ISongPresentation {
  public getSongById: (song: Song) => TDataResponse<{ song: Song }> = (
    song
  ) => {
    return {
      status: 'success',
      data: {
        song,
      },
    };
  };

  public postSong: (song: Song) => TDataResponse<{ songId: string }> = (
    song
  ) => {
    return {
      status: 'success',
      data: {
        songId: song.id,
      },
    };
  };

  public putSong: (song: Song) => TMessageResponse = (song) => {
    return {
      status: 'success',
      message: SONG.PRESENTATION_MSG.putSong(song.id),
    };
  };

  public deleteSong: (song: Song) => TMessageResponse = (song) => {
    return {
      status: 'success',
      message: SONG.PRESENTATION_MSG.deleteSong(song.id),
    };
  };

  public getSongs: (songs: Song[]) => TDataResponse<{ songs: TGetSongs[] }> = (
    songs
  ) => {
    const mappedSongs = songs.map((song) => ({
      id: song.id,
      title: song.title,
      performer: song.performer,
    }));
    return {
      status: 'success',
      data: {
        songs: mappedSongs,
      },
    };
  };
}

export default SongPresentation;
