import Joi from 'joi';
import type { AlbumDTO, TAlbumSchema } from '../types/albums.js';

const postSchema = Joi.object<AlbumDTO>({
  name: Joi.string().required(),
  year: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear())
    .required(),
  likesCount: Joi.number().integer().min(0).default(0),
  coverUrl: Joi.string().uri().allow(null).default(null).optional(),
});

const putSchema = Joi.object<AlbumDTO>({
  name: Joi.string().required(),
  year: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear())
    .required(),
  likesCount: Joi.number().integer().min(0).default(0),
  coverUrl: Joi.string().uri().allow(null).optional(),
});

const validationObj: TAlbumSchema = {
  postSchema,
  putSchema,
};

export default validationObj;
