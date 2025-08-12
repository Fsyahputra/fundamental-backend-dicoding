import type Joi from 'joi';
import { BadRequestError, NotFoundError } from './exception.js';
import type { ICacheService } from './types/cache.js';

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

export const fetchFromCacheOrDefault = async <T>(
  id: string,
  cacheService: ICacheService,
  fetchFunction: () => Promise<T | null>
): Promise<{
  data: T;
  fromCache: boolean;
}> => {
  let fromCache = true;
  let data = await cacheService.get<T>(id);
  if (data === null) {
    data = await checkIsExist<T>(`Data with id ${id} not found`, fetchFunction);
    fromCache = false;
    await cacheService.set(id, data);
  }
  return { data, fromCache };
};
