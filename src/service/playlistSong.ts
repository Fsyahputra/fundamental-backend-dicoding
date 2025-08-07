import type { Pool } from "pg";
import type { IPlaylistSongService, TPlaylistSong, TPlaylistSongDTO } from "../types/playlistSons.js";
import { nanoid } from "nanoid";
import autoBind from "auto-bind";

class PlaylistSongService implements IPlaylistSongService {
  private pool: Pool;
  private static TABLE_NAME = "playlist_songs";
  private static idPrefix = "playlist-song" + "-";
  private idGenerator: () => string;

  constructor(pool: Pool, idGenerator: () => string = nanoid) {
    this.pool = pool;
    this.idGenerator = idGenerator;
    autoBind(this);
  }

  private generateId(): string {
    const id = PlaylistSongService.idPrefix + this.idGenerator();
    return id;
  }

  public async save(playlistData: TPlaylistSongDTO): Promise<TPlaylistSong> {
    const id = this.generateId();
    const newPlaylistSong: TPlaylistSong = {
      id,
      ...playlistData,
    };

    await this.pool.query(`INSERT INTO ${PlaylistSongService.TABLE_NAME} (id, song_id, playlist_id) VALUES ($1, $2, $3)`, [newPlaylistSong.id, newPlaylistSong.songId, newPlaylistSong.playlistId]);

    return newPlaylistSong;
  }

  public async delete(playlistId: string, songId: string): Promise<void> {
    const query = {
      text: `DELETE FROM ${PlaylistSongService.TABLE_NAME} WHERE playlist_id = $1 AND song_id = $2`,
      values: [playlistId, songId],
    };
    await this.pool.query(query);
  }
}

export default PlaylistSongService;
