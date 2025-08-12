import type { Pool } from 'pg';
import type {
  IAlbumLikesService,
  TAlbumLikes,
  TAlbumLikesDTO,
} from '../types/albumLikes.js';
import { nanoid } from 'nanoid';
import ClientError from '../exception.js';

class AlbumLikesService implements IAlbumLikesService {
  private pool: Pool;
  private static TABLE_NAME = 'album_likes';
  private static idPrefix = 'album_like-';
  private idGenerator: () => string;
  constructor(pool: Pool, idGenerator: () => string = nanoid) {
    this.pool = pool;
    this.idGenerator = idGenerator;
  }

  private generateId(): string {
    const id = AlbumLikesService.idPrefix + this.idGenerator();
    return id;
  }

  public async addLike(data: TAlbumLikesDTO): Promise<TAlbumLikes> {
    const isLiked = await this.isLikedByUser(data.userId, data.albumId);
    if (isLiked) {
      throw new ClientError(
        `User with id ${data.userId} already liked album with id ${data.albumId}`
      );
    }
    const id = this.generateId();
    const query = {
      text: `INSERT INTO ${AlbumLikesService.TABLE_NAME} (id, user_id, album_id) VALUES ($1, $2, $3) RETURNING id, user_id, album_id`,
      values: [id, data.userId, data.albumId],
    };
    const result = await this.pool.query(query);
    if (result.rowCount === 0) {
      throw new Error('Failed to add like');
    }
    return {
      id: result.rows[0].id,
      userId: result.rows[0].user_id,
      albumId: result.rows[0].album_id,
    };
  }

  public async deleteLike(data: TAlbumLikesDTO): Promise<void> {
    const isLiked = await this.isLikedByUser(data.userId, data.albumId);
    if (!isLiked) {
      throw new ClientError(
        `User with id ${data.userId} has not liked album with id ${data.albumId}`
      );
    }
    const query = {
      text: `DELETE FROM ${AlbumLikesService.TABLE_NAME} WHERE user_id = $1 AND album_id = $2`,
      values: [data.userId, data.albumId],
    };
    const result = await this.pool.query(query);
    if (result.rowCount === 0) {
      throw new Error('Failed to delete like or like does not exist');
    }
  }

  public async isLikedByUser(
    userId: string,
    albumId: string
  ): Promise<boolean> {
    const query = {
      text: `SELECT COUNT(*) FROM ${AlbumLikesService.TABLE_NAME} WHERE user_id = $1 AND album_id = $2`,
      values: [userId, albumId],
    };
    const result = await this.pool.query(query);
    return parseInt(result.rows[0].count, 10) > 0;
  }

  public async getLikesCount(albumId: string): Promise<number> {
    const query = {
      text: `SELECT COUNT(*) FROM ${AlbumLikesService.TABLE_NAME} WHERE album_id = $1`,
      values: [albumId],
    };
    const result = await this.pool.query(query);
    return parseInt(result.rows[0].count, 10);
  }
}

export default AlbumLikesService;
