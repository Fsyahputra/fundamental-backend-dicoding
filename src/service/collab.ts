import type { Pool } from 'pg';
import type { ICollabService, TCollab, TCollabDTO } from '../types/collab.js';
import { nanoid } from 'nanoid';
import { NotFoundError } from '../exception.js';
import autoBind from 'auto-bind';
import COLLAB from '../constant/collab.js';

class CollabService implements ICollabService {
  private idGenerator: () => string;
  private pool: Pool;
  private static TABLE_NAME = COLLAB.SERVICE.TABLE_NAME;
  private static idPrefix = COLLAB.SERVICE.ID_PREFIX;

  constructor(pool: Pool, idGenerator: () => string = nanoid) {
    this.pool = pool;
    this.idGenerator = idGenerator;
    autoBind(this);
  }

  public async getPlaylistIdByUserId(userId: string): Promise<string[]> {
    const result = await this.pool.query(
      `SELECT playlist_id FROM ${CollabService.TABLE_NAME} WHERE user_id = $1`,
      [userId]
    );
    return result.rows.map((row) => row.playlist_id);
  }

  private generateId(): string {
    const id = CollabService.idPrefix + this.idGenerator();
    return id;
  }

  private ensureCollabExists(result: any): null | void {
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  }

  public async addCollab(collab: TCollabDTO): Promise<TCollab> {
    const id = this.generateId();
    const result = await this.pool.query(
      `INSERT INTO ${CollabService.TABLE_NAME} (id, playlist_id, user_id) VALUES ($1, $2, $3) RETURNING *`,
      [id, collab.playlistId, collab.userId]
    );
    return result.rows[0];
  }

  public async removeCollab(collab: TCollabDTO): Promise<TCollab> {
    const result = await this.pool.query(
      `DELETE FROM ${CollabService.TABLE_NAME} WHERE playlist_id = $1 AND user_id = $2 RETURNING *`,
      [collab.playlistId, collab.userId]
    );
    if (!this.ensureCollabExists(result)) {
      throw new NotFoundError(
        COLLAB.SERVICE.ERROR_MESSAGES.COLLABORATION_NOT_FOUND
      );
    }
    return result.rows[0];
  }

  public async getUserIdByPlaylistId(
    playlistId: string
  ): Promise<string[] | null> {
    const result = await this.pool.query(
      `SELECT user_id FROM ${CollabService.TABLE_NAME} WHERE playlist_id = $1`,
      [playlistId]
    );
    if (!this.ensureCollabExists(result)) {
      return null;
    }
    return result.rows.map((row) => row.user_id);
  }
}

export default CollabService;
