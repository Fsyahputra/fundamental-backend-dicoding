import { nanoid } from 'nanoid/non-secure';
import ActivityService from '../service/activity.js';
import AlbumService from '../service/albums.js';
import SongsService from '../service/songs.js';
import AuthService from '../service/auth.js';
import CollabService from '../service/collab.js';
import MusicCoordService from '../service/musicCoord.js';
import PlaylistService from '../service/playlist.js';
import UserService from '../service/user.js';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import JwtAuthScheme from '../jwtScheme.js';
import PlaylistSongService from '../service/playlistSong.js';
import AuthorizationService from '../service/authorization.js';
dotenv.config();

export const pool = new Pool({
  user: process.env['PG_USER'],
  password: process.env['PG_PASSWORD'],
  host: process.env['PG_HOST'],
  database: process.env['PG_DATABASE'],
  port: Number(process.env['PG_PORT']) || 5432,
});

const accessTokenSecret =
  process.env['ACCESS_TOKEN_KEY'] || 'defaultAccessTokenKey';
const refreshTokenSecret =
  process.env['REFRESH_TOKEN_KEY'] || 'defaultRefreshTokenKey';
const playlistSongService = new PlaylistSongService(pool, nanoid);

const activityService = new ActivityService(pool);
const albumService = new AlbumService(pool, nanoid);
const songService = new SongsService(pool, nanoid);
const authService = new AuthService(
  accessTokenSecret,
  refreshTokenSecret,
  pool
);
const jwtAuthScheme = new JwtAuthScheme(authService);
const collabService = new CollabService(pool, nanoid);
const playlistService = new PlaylistService(pool, nanoid);
const musicCoordService = new MusicCoordService(
  playlistService,
  songService,
  playlistSongService
);
const userService = new UserService(pool, nanoid);
const authorizationService = new AuthorizationService(
  playlistService,
  collabService
);

const serviceObject = {
  activityService,
  albumService,
  songService,
  authService,
  collabService,
  playlistService,
  musicCoordService,
  userService,
  jwtAuthScheme,
  playlistSongService,
  authorizationService,
};

export default serviceObject;
