import type { Pool } from 'pg';
import type { Album, AlbumDTO, IServiceAlbum } from '../types/albums.js';
import { nanoid } from 'nanoid';
import autoBind from 'auto-bind';

class AlbumService implements IServiceAlbum {
  private pool: Pool;
  private idGenerator: () => string;
  private static TABLE_NAME = 'albums';
  private static idPrefix = 'album' + '-';

  constructor(pool: Pool, idGenerator: () => string = nanoid) {
    this.pool = pool;
    this.idGenerator = idGenerator;
    autoBind(this);
  }

  private generateId(): string {
    const id = AlbumService.idPrefix + this.idGenerator();
    return id;
  }

  private toSnakeCase(str: string) {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  private buildUpdateQuery(
    album: Partial<AlbumDTO>,
    id: string
  ): { text: string; values: any[] } {
    const entries = Object.entries(album)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [this.toSnakeCase(k), v]); // konversi key

    if (entries.length === 0) {
      throw new Error('Nothing to update');
    }

    const setClause = entries
      .map(([field], index) => `${field} = $${index + 1}`)
      .join(', ');

    const values = entries.map(([, v]) => v);
    const queryText = `
    UPDATE ${AlbumService.TABLE_NAME}
    SET ${setClause}
    WHERE id = $${entries.length + 1}
    RETURNING id, name, year, likes_count, cover_url
  `;

    return {
      text: queryText.trim(),
      values: [...values, id],
    };
  }

  public async save(album: AlbumDTO): Promise<Album> {
    const id = this.generateId();
    const { name, year, likesCount, coverUrl } = album;
    const query = {
      text: `INSERT INTO ${AlbumService.TABLE_NAME} (id, name, year, likes_count, cover_url) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, year, likes_count, cover_url`,
      values: [id, name, year, likesCount, coverUrl ?? null],
    };
    const result = await this.pool.query(query);
    return {
      id: result.rows[0].id,
      name: result.rows[0].name,
      year: result.rows[0].year,
      likesCount: result.rows[0].likesCount ?? 0,
      coverUrl: result.rows[0].cover_url ?? null,
    };
  }

  public async getById(id: string): Promise<Album | null> {
    const query = {
      text: `SELECT id, name, year, likes_count, cover_url FROM ${AlbumService.TABLE_NAME} WHERE id = $1`,
      values: [id],
    };
    const result = await this.pool.query(query);
    if (result.rows.length === 0) {
      return null;
    }
    return {
      id: result.rows[0].id,
      name: result.rows[0].name,
      year: result.rows[0].year,
      likesCount: result.rows[0].likesCount ?? 0,
      coverUrl: result.rows[0].cover_url ?? null,
    };
  }

  public async delete(id: string): Promise<Album | null> {
    const query = {
      text: `DELETE FROM ${AlbumService.TABLE_NAME} WHERE id = $1 RETURNING id, name, year, likes_count, cover_url`,
      values: [id],
    };
    const result = await this.pool.query(query);
    if (result.rows.length === 0) {
      return null;
    }
    return {
      id: result.rows[0].id,
      name: result.rows[0].name,
      year: result.rows[0].year,
      likesCount: result.rows[0].likesCount ?? 0,
      coverUrl: result.rows[0].cover_url ?? null,
    };
  }

  public async update(
    id: string,
    album: Partial<AlbumDTO>
  ): Promise<Album | null> {
    const query = this.buildUpdateQuery(album, id);
    const result = await this.pool.query(query);
    if (result.rows.length === 0) {
      return null;
    }
    return {
      id: result.rows[0].id,
      name: result.rows[0].name,
      year: result.rows[0].year,
      likesCount: result.rows[0].likesCount ?? 0,
      coverUrl: result.rows[0].cover_url ?? null,
    };
  }

  public async addLikes(id: string): Promise<Album | null> {
    const query = {
      text: `UPDATE ${AlbumService.TABLE_NAME} SET likes_count = likes_count + 1 WHERE id = $1 RETURNING id, name, year, likes_count, cover_url`,
      values: [id],
    };
    const result = await this.pool.query(query);
    if (result.rows.length === 0) {
      return null;
    }
    return {
      id: result.rows[0].id,
      name: result.rows[0].name,
      year: result.rows[0].year,
      likesCount: result.rows[0].likesCount ?? 0,
      coverUrl: result.rows[0].cover_url ?? null,
    };
  }

  public async removeLikes(id: string): Promise<Album | null> {
    const query = {
      text: `UPDATE ${AlbumService.TABLE_NAME} SET likes_count = likes_count - 1 WHERE id = $1 RETURNING id, name, year, likes_count, cover_url`,
      values: [id],
    };
    const result = await this.pool.query(query);
    if (result.rows.length === 0) {
      return null;
    }
    return {
      id: result.rows[0].id,
      name: result.rows[0].name,
      year: result.rows[0].year,
      likesCount: result.rows[0].likesCount ?? 0,
      coverUrl: result.rows[0].cover_url ?? null,
    };
  }
}

export default AlbumService;
