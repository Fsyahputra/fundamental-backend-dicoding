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
import type { IMsgService } from '../types/msg.js';
import { checkIsExist } from '../utils.js';
import dotenv from 'dotenv';

dotenv.config();

class PlaylistService implements IPlayListService {
  private pool: Pool;
  private exportQueue = process.env['RABBIT_QUEUE_NAME'] || 'export:playlist';
  private static TABLE_NAME = 'playlists';
  private static idPrefix = 'playlist' + '-';
  private msgService: IMsgService;
  private idGenerator: () => string;

  constructor(
    pool: Pool,
    idGenerator: () => string = nanoid,
    msgService: IMsgService
  ) {
    this.pool = pool;
    this.idGenerator = idGenerator;
    this.msgService = msgService;
    autoBind(this);
  }

  private convertToPlaylist(row: any): TPlaylist {
    return {
      id: row.id,
      name: row.name,
      owner: row.owner,
    };
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
    return result.rows.map((row) => this.convertToPlaylist(row));
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
    return this.convertToPlaylist(result.rows[0]);
  }

  public async getAll(owner: string): Promise<TPlaylist[]> {
    const query = {
      text: `SELECT id, name, owner FROM ${PlaylistService.TABLE_NAME} WHERE owner = $1`,
      values: [owner],
    };
    const result = await this.pool.query(query);
    return result.rows.map((row) => this.convertToPlaylist(row));
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
    return this.convertToPlaylist(result.rows[0]);
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
    return this.convertToPlaylist(result.rows[0]);
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
    return result.rows.map((row) => this.convertToPlaylist(row));
  }

  public async exportPlaylist(
    targetEmail: string,
    playlistId: string
  ): Promise<TPlaylist> {
    const playlist = checkIsExist<TPlaylist>('Playlist Not Found', () =>
      this.getById(playlistId)
    );
    await this.msgService.sendMsg(
      JSON.stringify({
        targetEmail,
        playlistId,
      }),
      this.exportQueue
    );
    return playlist;
  }
}

export default PlaylistService;
