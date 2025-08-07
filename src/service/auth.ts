import type { IAuthenticationService, TAuthObj } from "../types/auth.js";
import jwt, { type SignOptions } from "jsonwebtoken";
import bcrypt from "bcrypt";
import type { TAuthCredentials, TAuthResponse } from "../types/auth.js";
import { BadRequestError, UnauthorizedError } from "../exception.js";
import type { Pool } from "pg";
import autoBind from "auto-bind";

class AuthService implements IAuthenticationService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private pool: Pool;
  private accessTokenExpiration: SignOptions = { expiresIn: "15m" };
  private refreshTokenExpiration: SignOptions = { expiresIn: "7d" };

  constructor(accessTokenSecret: string, refreshTokenSecret: string, pool: Pool) {
    this.accessTokenSecret = accessTokenSecret;
    this.refreshTokenSecret = refreshTokenSecret;
    this.pool = pool;
    autoBind(this);
  }

  private async saveRefreshToken(token: string): Promise<void> {
    const existingToken = await this.getRefreshToken(token);
    if (existingToken) {
      return;
    }
    const query = {
      text: `INSERT INTO tokens (token) VALUES ($1)`,
      values: [token],
    };
    await this.pool.query(query);
  }

  private async getRefreshToken(token: string): Promise<string | null> {
    const query = {
      text: `SELECT token FROM tokens WHERE token = $1`,
      values: [token],
    };
    const result = await this.pool.query(query);
    return result.rows.length > 0 ? result.rows[0].token : null;
  }

  private async deleteRefreshToken(token: string): Promise<void> {
    const query = {
      text: `DELETE FROM tokens WHERE token = $1`,
      values: [token],
    };
    await this.pool.query(query);
  }

  private async validateToken(token: string): Promise<TAuthObj> {
    try {
      const tokenData = await this.getRefreshToken(token);
      if (!tokenData) {
        throw new BadRequestError();
      }
      return jwt.verify(token, this.refreshTokenSecret) as TAuthObj;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new BadRequestError("Invalid token");
      }

      if (error instanceof jwt.TokenExpiredError) {
        this.deleteRefreshToken(token);
        throw new UnauthorizedError("Token expired");
      }

      throw error;
    }
  }

  public async authenticate(cred: TAuthCredentials): Promise<TAuthResponse> {
    const isPasswordValid = await bcrypt.compare(cred.password, cred.hashedPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid username or password");
    }
    const accessToken = jwt.sign({ id: cred.userId, username: cred.username }, this.accessTokenSecret, this.accessTokenExpiration);
    const refreshToken = jwt.sign({ id: cred.userId, username: cred.username }, this.refreshTokenSecret, this.refreshTokenExpiration);
    await this.saveRefreshToken(refreshToken);
    return { accessToken, refreshToken };
  }

  public async refreshToken(token: string): Promise<string> {
    const decoded = await this.validateToken(token);
    const newAccessToken = jwt.sign({ id: decoded.id, username: decoded.username }, this.accessTokenSecret, this.accessTokenExpiration);
    return newAccessToken;
  }

  public async invalidateToken(token: string): Promise<void> {
    const existingToken = await this.getRefreshToken(token);
    if (!existingToken) {
      throw new BadRequestError("Refresh token not found");
    }
    await this.deleteRefreshToken(token);
  }

  public async verifyAccessToken(token: string): Promise<TAuthObj> {
    try {
      return jwt.verify(token, this.accessTokenSecret) as TAuthObj;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError("Invalid access token");
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError("Access token expired");
      }
      throw error;
    }
  }
}

export default AuthService;
