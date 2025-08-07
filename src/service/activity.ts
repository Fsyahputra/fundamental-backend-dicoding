import type { Pool } from 'pg';
import type {
  TActivityDTO,
  IActivityService,
  TActivity,
} from '../types/activity.js';
import { nanoid } from 'nanoid';
import autoBind from 'auto-bind';

class ActivityService implements IActivityService {
  private idGenerator: () => string;
  private pool: Pool;
  private static TABLE_NAME = 'playlist_songs_activities';
  private static idPrefix = 'playlist_songs_activitie' + '-';
  constructor(pool: Pool, idGenerator: () => string = nanoid) {
    this.pool = pool;
    this.idGenerator = idGenerator;
    autoBind(this);
  }

  private generateId(): string {
    const id = ActivityService.idPrefix + this.idGenerator();
    return id;
  }

  private async insertActivity(activity: TActivityDTO): Promise<TActivity> {
    const id = this.generateId();
    const newDate = new Date();
    const query = {
      text: `INSERT INTO ${ActivityService.TABLE_NAME} (id, playlist_id, song_id, user_id, action, time) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      values: [
        id,
        activity.playlistId,
        activity.songId,
        activity.userId,
        activity.action,
        newDate,
      ],
    };
    const result = await this.pool.query(query);
    return { ...activity, id: result.rows[0].id, time: newDate };
  }

  public async getActivitiesByPlaylistId(
    playlistId: string
  ): Promise<TActivity[]> {
    const query = {
      text: `SELECT * FROM ${ActivityService.TABLE_NAME} WHERE playlist_id = $1`,
      values: [playlistId],
    };
    const result = await this.pool.query(query);
    if (result.rows.length === 0) {
      return [];
    }
    return result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      songId: row.song_id,
      action: row.action,
      playlistId: row.playlist_id,
      time: row.time,
    }));
  }

  public async addActivity(
    activity: Omit<TActivityDTO, 'action'>
  ): Promise<TActivity> {
    return this.insertActivity({ ...activity, action: 'add' });
  }

  public async deleteActivity(
    activity: Omit<TActivityDTO, 'action'>
  ): Promise<TActivity> {
    return this.insertActivity({ ...activity, action: 'delete' });
  }
}

export default ActivityService;
