import Joi from "joi";
import type { AlbumDTO, TAlbumSchema } from "../types/albums.js";

const postSchema = Joi.object<AlbumDTO>({
  name: Joi.string().required(),
  year: Joi.number().integer().min(1900).max(new Date().getFullYear()).required(),
});

const putSchema = Joi.object<AlbumDTO>({
  name: Joi.string().required(),
  year: Joi.number().integer().min(1900).max(new Date().getFullYear()).required(),
});

const validationObj: TAlbumSchema = {
  postSchema,
  putSchema,
};

export default validationObj;
