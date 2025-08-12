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
import type { IMsgService } from '../types/msg.js';
import RabbitMqMsgImpl from '../service/msg.js';
import AlbumLikesService from '../service/albumLikes.js';
import CoverService from '../service/cover.js';
import CacheServiceRedisImpl from '../service/cache.js';
import config from '../conf/conf.js';

dotenv.config();

export const pool = new Pool({
  user: config.pg.pgUser,
  password: config.pg.pgPassword,
  host: config.pg.pgHost,
  database: config.pg.pgDatabase,
  port: config.pg.pgPort,
});

const cacheService = new CacheServiceRedisImpl(config.url.redisUrl, 1800);
const coverService = new CoverService(config.coverUploadPath);
const playlistSongService = new PlaylistSongService(pool, nanoid);
const albumLikesService = new AlbumLikesService(pool, nanoid);
const msgService: IMsgService = new RabbitMqMsgImpl(config.url.rabbitMqUrl);
const activityService = new ActivityService(pool);
const albumService = new AlbumService(pool, nanoid);
const songService = new SongsService(pool, nanoid);
const authService = new AuthService(
  config.token.accessTokenSecret,
  config.token.refreshTokenSecret,
  pool
);
const jwtAuthScheme = new JwtAuthScheme(authService);
const collabService = new CollabService(pool, nanoid);
const playlistService = new PlaylistService(pool, nanoid, msgService);
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
  msgService,
  albumLikesService,
  coverService,
  cacheService,
};

export default serviceObject;
