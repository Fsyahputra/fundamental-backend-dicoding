import Joi from 'joi';
import type { TCollabDTO } from '../types/collab.js';

const postCollab = Joi.object<TCollabDTO>({
  playlistId: Joi.string().required(),
  userId: Joi.string().required(),
});

const deleteCollab = Joi.object<TCollabDTO>({
  playlistId: Joi.string().required(),
  userId: Joi.string().required(),
});

const collabValidator = {
  postCollab,
  deleteCollab,
};

export default collabValidator;
