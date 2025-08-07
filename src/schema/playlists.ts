import Joi from 'joi';
import type { TPlaylistDTO } from '../types/playlist.js';

const postSchema = Joi.object<TPlaylistDTO>({
  name: Joi.string().required(),
  owner: Joi.string().required(),
});

const postSongSchema = Joi.object({
  songId: Joi.string().required(),
});

const postSongToPlaylistSchema = Joi.object({
  playlistId: Joi.string().required(),
  songId: Joi.string().required(),
});

const validationObj = {
  postSchema,
  postSongSchema,
  postSongToPlaylistSchema,
};

export default validationObj;
