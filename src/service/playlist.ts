import type { Pool } from 'pg';
import type {
  IPlayListService,
  TJPlaylistSongs,
  TPlaylist,
  TPlaylistDTO,
} from '../types/playlist.js';
import { nanoid } from 'nanoid';
import { NotFoundError } from '../exception.js';
import autoBind from 'auto-bind';

class PlaylistService implements IPlayListService {
  private pool: Pool;
  private static TABLE_NAME = 'playlists';
  private static idPrefix = 'playlist' + '-';
  private idGenerator: () => string;

  constructor(pool: Pool, idGenerator: () => string = nanoid) {
    this.pool = pool;
    this.idGenerator = idGenerator;
    autoBind(this);
  }

  findManyPlaylist: (ids: string[]) => Promise<TPlaylist[]> = async (
    ids: string[]
  ) => {
    if (ids.length === 0) {
      return [];
    }
    const query = {
      text: `SELECT id, name, owner FROM ${PlaylistService.TABLE_NAME} WHERE id = ANY($1)`,
      values: [ids],
    };
    const result = await this.pool.query(query);
    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      owner: row.owner,
    }));
  };

  private generateId(): string {
    const id = PlaylistService.idPrefix + this.idGenerator();
    return id;
  }

  public async save(playList: TPlaylistDTO): Promise<TPlaylist> {
    const id = this.generateId();
    const { name, owner } = playList;
    const query = {
      text: `INSERT INTO ${PlaylistService.TABLE_NAME} (id, name, owner) VALUES ($1, $2, $3) RETURNING id, name, owner`,
      values: [id, name, owner],
    };
    const result = await this.pool.query(query);
    return {
      id: result.rows[0].id,
      name: result.rows[0].name,
      owner: result.rows[0].owner,
    };
  }

  public async getAll(owner: string): Promise<TPlaylist[]> {
    const query = {
      text: `SELECT id, name, owner FROM ${PlaylistService.TABLE_NAME} WHERE owner = $1`,
      values: [owner],
    };
    const result = await this.pool.query(query);
    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      owner: row.owner,
    }));
  }

  public async delete(id: string): Promise<TPlaylist> {
    const query = {
      text: `DELETE FROM ${PlaylistService.TABLE_NAME} WHERE id = $1 RETURNING id, name, owner`,
      values: [id],
    };
    const result = await this.pool.query(query);
    if (result.rows.length === 0) {
      throw new NotFoundError(`Playlist with id ${id} not found`);
    }
    return {
      id: result.rows[0].id,
      name: result.rows[0].name,
      owner: result.rows[0].owner,
    };
  }

  public async getById(id: string): Promise<TPlaylist | null> {
    const query = {
      text: `SELECT id, name, owner FROM ${PlaylistService.TABLE_NAME} WHERE id = $1`,
      values: [id],
    };
    const result = await this.pool.query(query);
    if (result.rows.length === 0) {
      return null;
    }
    return {
      id: result.rows[0].id,
      name: result.rows[0].name,
      owner: result.rows[0].owner,
    };
  }

  public async savePlaylistSong(
    playlistId: string,
    songId: string
  ): Promise<TJPlaylistSongs> {
    const query = {
      text: `INSERT INTO playlist_songs (playlist_id, song_id) VALUES ($1, $2) RETURNING playlist_id, song_id`,
      values: [playlistId, songId],
    };
    const result = await this.pool.query(query);
    return {
      playlistId: result.rows[0].playlist_id,
      songId: result.rows[0].song_id,
    };
  }

  public async deletePlaylistSong(
    playlistId: string,
    songId: string
  ): Promise<void> {
    const query = {
      text: `DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2`,
      values: [playlistId, songId],
    };
    await this.pool.query(query);
  }

  public async getPlaylistByOwner(owner: string): Promise<TPlaylist[]> {
    const query = {
      text: `SELECT id, name, owner FROM ${PlaylistService.TABLE_NAME} WHERE owner = $1`,
      values: [owner],
    };
    const result = await this.pool.query(query);
    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      owner: row.owner,
    }));
  }
}

export default PlaylistService;
