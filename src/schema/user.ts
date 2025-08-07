import Joi from "joi";
import type { TUserDTO } from "../types/users.js";
import type { TAuthResponse } from "../types/auth.js";

const postSchema = Joi.object<TUserDTO>({
  username: Joi.string().min(3).max(30).required(),
  password: Joi.string().min(6).required(),
  fullname: Joi.string().min(3).max(50).required(),
});

const postAuthSchema = Joi.object<TUserDTO>({
  username: Joi.string().min(3).max(30).required(),
  password: Joi.string().min(2).required(),
});

const putAuthSchema = Joi.object<TAuthResponse>({
  refreshToken: Joi.string().required(),
});

const deleteAuthSchema = Joi.object<TAuthResponse>({
  refreshToken: Joi.string().required(),
});

const validationObj = {
  postSchema,
  postAuthSchema,
  putAuthSchema,
  deleteAuthSchema,
};

export default validationObj;
