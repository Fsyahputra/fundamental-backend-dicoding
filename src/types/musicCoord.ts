import type { TPlaylist } from './playlist.js';
import type { Song } from './songs.js';

export type PlaylistSong<T> = {
  song: T;
  playlist: TPlaylist;
};

export interface IPlaylistServiceCoord {
  addSongToPlaylist: (
    playListId: string,
    songId: string
  ) => Promise<PlaylistSong<Song>>;
  removeSongFromPlaylist: (playListId: string, songId: string) => Promise<void>;
  getSongsInPlaylist: (playListId: string) => Promise<PlaylistSong<Song>[]>;
}
