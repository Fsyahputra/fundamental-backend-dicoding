import autoBind from 'auto-bind';
import type { IUserService, TUser, TUserDTO } from '../types/users.js';
import { nanoid } from 'nanoid/non-secure';
import type { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { BadRequestError } from '../exception.js';

class UserService implements IUserService {
  private pool: Pool;
  private idGenerator: () => string;
  private static TABLE_NAME = 'users';
  private static idPrefix = 'user' + '-';

  constructor(pool: Pool, idGenerator: () => string = nanoid) {
    this.pool = pool;
    this.idGenerator = idGenerator;
    autoBind(this);
  }

  private generateId(): string {
    const id = UserService.idPrefix + this.idGenerator();
    return id;
  }

  private async checkExistingUsername(username: string): Promise<boolean> {
    const query = {
      text: `SELECT 1 FROM ${UserService.TABLE_NAME} WHERE username = $1`,
      values: [username],
    };
    const result = await this.pool.query(query);
    return (result.rowCount ?? 0) > 0;
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  public async save(user: TUserDTO): Promise<TUser> {
    const id = this.generateId();
    const { username, password, fullname } = user;
    if (await this.checkExistingUsername(username)) {
      throw new BadRequestError(`Username ${username} already exists`);
    }
    const hashedPassword = await this.hashPassword(password);
    const query = {
      text: `INSERT INTO ${UserService.TABLE_NAME} (id, username, password, fullname) VALUES ($1, $2, $3, $4) RETURNING id, username, fullname`,
      values: [id, username, hashedPassword, fullname],
    };
    const result = await this.pool.query(query);
    return {
      id: result.rows[0].id,
      username: result.rows[0].username,
      fullname: result.rows[0].fullname,
      password: hashedPassword,
    };
  }

  public async getById(id: string): Promise<TUser | null> {
    const query = {
      text: `SELECT id, username, fullname FROM ${UserService.TABLE_NAME} WHERE id = $1`,
      values: [id],
    };
    const result = await this.pool.query(query);
    if (result.rows.length === 0) {
      return null;
    }
    const row = result.rows[0];
    return {
      id: row.id,
      username: row.username,
      fullname: row.fullname,
      password: '',
    }; // Password is not returned for security reasons
  }

  public async getByUsername(username: string): Promise<TUser | null> {
    const query = {
      text: `SELECT id, username, fullname, password FROM ${UserService.TABLE_NAME} WHERE username = $1`,
      values: [username],
    };
    const result = await this.pool.query(query);
    if (result.rows.length === 0) {
      return null;
    }
    const row = result.rows[0];
    return {
      id: row.id,
      username: row.username,
      fullname: row.fullname,
      password: row.password,
    }; // Password is not returned for security reasons
  }

  public async getManyByIds(ids: string[]): Promise<TUser[]> {
    if (ids.length === 0) {
      return [];
    }
    const query = {
      text: `SELECT id, username, fullname FROM ${UserService.TABLE_NAME} WHERE id = ANY($1)`,
      values: [ids],
    };
    const result = await this.pool.query(query);
    return result.rows.map((row) => ({
      id: row.id,
      username: row.username,
      fullname: row.fullname,
      password: '',
    }));
  }
}

export default UserService;
