import type { Pool } from 'pg';
import type { Album, AlbumDTO, IServiceAlbum } from '../types/albums.js';
import { nanoid } from 'nanoid';
import autoBind from 'auto-bind';
import ALBUM from '../constant/albums.js';

class AlbumService implements IServiceAlbum {
  private pool: Pool;
  private idGenerator: () => string;
  private static TABLE_NAME = ALBUM.SERVICE.TABLE_NAME;
  private static idPrefix = ALBUM.SERVICE.ID_PREFIX;

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
      throw new Error(ALBUM.SERVICE.ERROR_MESSAGES.NOTHING_TO_UPDATE);
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

  private convertToAlbum(result: any): Album {
    return {
      id: result.id,
      name: result.name,
      year: result.year,
      likesCount: result.likes_count ?? 0,
      coverUrl: result.cover_url ?? null,
    };
  }

  private checkResult(result: any): boolean {
    if (result.rows.length === 0) {
      return false;
    }
    return true;
  }

  public async save(album: AlbumDTO): Promise<Album> {
    const id = this.generateId();
    const { name, year, likesCount, coverUrl } = album;
    const query = {
      text: `INSERT INTO ${AlbumService.TABLE_NAME} (id, name, year, likes_count, cover_url) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, year, likes_count, cover_url`,
      values: [id, name, year, likesCount, coverUrl ?? null],
    };
    const result = await this.pool.query(query);
    return this.convertToAlbum(result.rows[0]);
  }

  public async getById(id: string): Promise<Album | null> {
    const query = {
      text: `SELECT id, name, year, likes_count, cover_url FROM ${AlbumService.TABLE_NAME} WHERE id = $1`,
      values: [id],
    };
    const result = await this.pool.query(query);
    if (!this.checkResult(result)) {
      return null;
    }
    return this.convertToAlbum(result.rows[0]);
  }

  public async delete(id: string): Promise<Album | null> {
    const query = {
      text: `DELETE FROM ${AlbumService.TABLE_NAME} WHERE id = $1 RETURNING id, name, year, likes_count, cover_url`,
      values: [id],
    };
    const result = await this.pool.query(query);
    if (!this.checkResult(result)) {
      return null;
    }
    return this.convertToAlbum(result.rows[0]);
  }

  public async update(
    id: string,
    album: Partial<AlbumDTO>
  ): Promise<Album | null> {
    const query = this.buildUpdateQuery(album, id);
    const result = await this.pool.query(query);
    if (!this.checkResult(result)) {
      return null;
    }
    return this.convertToAlbum(result.rows[0]);
  }

  public async addLikes(id: string): Promise<Album | null> {
    const query = {
      text: `UPDATE ${AlbumService.TABLE_NAME} SET likes_count = likes_count + 1 WHERE id = $1 RETURNING id, name, year, likes_count, cover_url`,
      values: [id],
    };
    const result = await this.pool.query(query);
    if (!this.checkResult(result)) {
      return null;
    }
    return this.convertToAlbum(result.rows[0]);
  }

  public async removeLikes(id: string): Promise<Album | null> {
    const query = {
      text: `UPDATE ${AlbumService.TABLE_NAME} SET likes_count = likes_count - 1 WHERE id = $1 RETURNING id, name, year, likes_count, cover_url`,
      values: [id],
    };
    const result = await this.pool.query(query);
    if (!this.checkResult(result)) {
      return null;
    }
    return this.convertToAlbum(result.rows[0]);
  }
}

export default AlbumService;
