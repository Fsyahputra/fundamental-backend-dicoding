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

const allowedMimeTypes = [
  'image/apng',
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'image/webp',
];

const postCoverSchema: Joi.ObjectSchema = Joi.object({
  cover: Joi.object({
    hapi: Joi.object({
      filename: Joi.string().required(),
      headers: Joi.object({
        'content-type': Joi.string()
          .valid(...allowedMimeTypes)
          .required(),
        'content-disposition': Joi.string().optional(),
      })
        .unknown(true)
        .required(),
    }).required(),
  })
    .unknown(true) // <== supaya properti internal stream seperti _events tidak error
    .required(),
});

const validationObj: TAlbumSchema = {
  postSchema,
  putSchema,
  postCoverSchema,
};

export default validationObj;
