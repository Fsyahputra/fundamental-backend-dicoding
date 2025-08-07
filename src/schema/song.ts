import Joi from "joi";
import type { SongDTO } from "../types/songs.js";

const postSchema = Joi.object<SongDTO>({
  title: Joi.string().required(),
  year: Joi.number().integer().min(1900).max(new Date().getFullYear()).required(),
  performer: Joi.string().required(),
  genre: Joi.string().required(),
  duration: Joi.number().integer().min(0).allow(null),
  albumId: Joi.string().allow(null),
});

const putSchema = Joi.object<SongDTO>({
  title: Joi.string().required(),
  year: Joi.number().integer().min(1900).max(new Date().getFullYear()).required(),
  performer: Joi.string().required(),
  genre: Joi.string().required(),
  duration: Joi.number().integer().min(0).allow(null),
  albumId: Joi.string().allow(null),
});

const validationObj = {
  postSchema,
  putSchema,
};

export default validationObj;
