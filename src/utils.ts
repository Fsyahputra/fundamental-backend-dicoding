import type Joi from 'joi';
import { BadRequestError, NotFoundError } from './exception.js';

export const checkData = <T>(data: any, schema: Joi.ObjectSchema): T => {
  const { error, value } = schema.validate(data);
  if (error) {
    throw new BadRequestError(`Invalid data: ${error.message}`);
  }
  return value;
};

// Utility function to transform null or undefined function results into NotFoundError
// Throws NotFoundError if the value is null or undefined
export const checkIsExist = async <T>(
  msg: string = 'Data not found',
  func: () => Promise<T | null>
): Promise<T> => {
  const result = await func();
  if (result === null || result === undefined) {
    throw new NotFoundError(msg);
  }
  return result;
};
