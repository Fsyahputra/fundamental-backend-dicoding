import { nanoid } from "nanoid";
import type { IServiceSong, queryParams, Song, SongDTO } from "../types/songs.js";
import type { Pool } from "pg";
import autoBind from "auto-bind";
import { NotFoundError, ServerError } from "../exception.js";

class SongsService implements IServiceSong {
  private pool: Pool;
  private idGenerator: () => string;
  private static TABLE_NAME = "songs";
  private static idPrefix = "song" + "-";

  constructor(pool: Pool, idGenerator: () => string = nanoid) {
    this.pool = pool;
    this.idGenerator = idGenerator;
    autoBind(this);
  }

  private generateId(): string {
    const id = SongsService.idPrefix + this.idGenerator();
    return id;
  }

  private buildUpdateQuery(song: Partial<SongDTO>, id: string): { text: string; values: any[] } {
    const entries = Object.entries(song).filter(([, v]) => v !== undefined);
    if (entries.length === 0) {
      throw new Error("Nothing to update");
    }

    const setClause = entries.map(([field], index) => `${field} = $${index + 1}`).join(", ");

    const values = entries.map(([, v]) => v);
    const queryText = `
    UPDATE ${SongsService.TABLE_NAME}
    SET ${setClause}
    WHERE id = $${entries.length + 1}
    RETURNING id, title, year, performer, genre, duration, album_id
  `;

    return {
      text: queryText.trim(),
      values: [...values, id],
    };
  }

  private async generateSongFromRow(row: Partial<Song> | undefined): Promise<Song> {
    if (!row) {
      throw new NotFoundError(`Song not found`);
    }
    return {
      id: row.id ?? "",
      title: row.title ?? "",
      year: row.year ?? 0,
      performer: row.performer ?? "",
      genre: row.genre ?? "",
      duration: row.duration ?? null,
      albumId: row.albumId ?? null,
    };
  }

  public async save(song: SongDTO): Promise<Song> {
    const id = this.generateId();
    const { title, year, performer, genre, duration, albumId } = song;
    const query = {
      text: `INSERT INTO ${SongsService.TABLE_NAME} (id, title, year, performer, genre, duration, album_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, title, year, performer, genre, duration, album_id`,
      values: [id, title, year, performer, genre, duration ?? null, albumId ?? null],
    };
    const result = await this.pool.query<Song>(query);
    const SongObj = await this.generateSongFromRow(result.rows[0]);
    if (!SongObj) {
      throw new ServerError(`Failed to save song with id ${id}`);
    }
    return SongObj;
  }

  public async getById(id: string): Promise<Song> {
    const query = {
      text: `SELECT id, title, year, performer, genre, duration, album_id FROM ${SongsService.TABLE_NAME} WHERE id = $1`,
      values: [id],
    };
    const result = await this.pool.query<Song>(query);
    if (result.rows.length === 0) {
      throw new NotFoundError(`Song with id ${id} not found`);
    }

    return this.generateSongFromRow(result.rows[0]);
  }

  public async delete(id: string): Promise<Song | null> {
    const query = {
      text: `DELETE FROM ${SongsService.TABLE_NAME} WHERE id = $1 RETURNING id, title, year, performer, genre, duration, album_id`,
      values: [id],
    };
    const result = await this.pool.query<Song>(query);
    if (result.rows.length === 0) {
      return null;
    }
    return this.generateSongFromRow(result.rows[0]);
  }

  public async update(id: string, song: Partial<SongDTO>): Promise<Song | null> {
    const query = this.buildUpdateQuery(song, id);
    const result = await this.pool.query<Song>(query);
    if (result.rows.length === 0) {
      return null;
    }
    return this.generateSongFromRow(result.rows[0]);
  }

  public async getAll(): Promise<Song[]> {
    const query = {
      text: `SELECT id, title, year, performer, genre, duration, album_id FROM ${SongsService.TABLE_NAME}`,
      values: [],
    };
    const result = await this.pool.query<Song>(query);
    const songs = await Promise.all(result.rows.map((row) => this.generateSongFromRow(row)));
    return songs.filter((song): song is Song => song !== null);
  }

  public async getByAlbumId(albumId: string): Promise<Song[]> {
    const query = {
      text: `SELECT id, title, year, performer, genre, duration, album_id FROM ${SongsService.TABLE_NAME} WHERE album_id = $1`,
      values: [albumId],
    };
    const result = await this.pool.query<Song>(query);
    const songs = await Promise.all(result.rows.map((row) => this.generateSongFromRow(row)));
    return songs.filter((song): song is Song => song !== null);
  }

  public async getByQueryParams(params: queryParams): Promise<Song[]> {
    const { title, performer } = params;
    let queryText = `SELECT id, title, year, performer, genre, duration, album_id FROM ${SongsService.TABLE_NAME}`;
    const values: any[] = [];
    const conditions: string[] = [];

    if (title) {
      conditions.push(`title ILIKE $${values.length + 1}`);
      values.push(`%${title}%`);
    }
    if (performer) {
      conditions.push(`performer ILIKE $${values.length + 1}`);
      values.push(`%${performer}%`);
    }

    if (conditions.length > 0) {
      queryText += ` WHERE ${conditions.join(" AND ")}`;
    }

    const query = {
      text: queryText,
      values,
    };

    const result = await this.pool.query<Song>(query);
    const songs = await Promise.all(result.rows.map((row) => this.generateSongFromRow(row)));
    return songs.filter((song): song is Song => song !== null);
  }

  public async getByPlaylistId(playlistId: string): Promise<Song[]> {
    const query = {
      text: `SELECT s.id, s.title, s.year, s.performer, s.genre, s.duration, s.album_id FROM ${SongsService.TABLE_NAME} AS s JOIN playlist_songs AS ps ON s.id = ps.song_id WHERE ps.playlist_id = $1`,
      values: [playlistId],
    };
    const result = await this.pool.query<Song>(query);
    const songs = await Promise.all(result.rows.map((row) => this.generateSongFromRow(row)));
    return songs.filter((song): song is Song => song !== null);
  }
}

export default SongsService;
