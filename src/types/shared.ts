import type Joi from "joi";

export type TSchemaObject<T> = {
  putSchema: Joi.ObjectSchema<T>;
  postSchema: Joi.ObjectSchema<T>;
};

export type TResponse = {
  status: "success" | "error";
  data?: any;
  message?: string;
};
