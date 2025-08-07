export type TPlaylistSongDTO = {
  songId: string;
  playlistId: string;
};

export type TPlaylistSong = {
  id: string;
  songId: string;
  playlistId: string;
};

export interface IPlaylistSongService {
  save: (playlistSong: TPlaylistSongDTO) => Promise<TPlaylistSong>;
  delete: (playlistId: string, songId: string) => Promise<void>;
}
