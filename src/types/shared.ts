import type Joi from 'joi';

export type TSchemaObject<T> = {
  putSchema: Joi.ObjectSchema<T>;
  postSchema: Joi.ObjectSchema<T>;
};

export type TResponse = {
  status: 'success' | 'error';
  data?: any;
  message?: string;
};

export interface TStatusResponse {
  status: 'success' | 'error';
}

export interface TDataResponse<T> extends TStatusResponse {
  data: T;
}

export interface TMessageResponse extends TStatusResponse {
  message: string;
}
