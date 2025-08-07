class ClientError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = "ClientError";
    this.statusCode = statusCode;
  }
}

export class NotFoundError extends ClientError {
  constructor(message: string = "Resource not found") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class BadRequestError extends ClientError {
  constructor(message: string = "Bad request") {
    super(message, 400);
    this.name = "BadRequestError";
  }
}

export class ForbiddenError extends ClientError {
  constructor(message: string = "Forbidden") {
    super(message, 403);
    this.name = "ForbiddenError";
  }
}

export class UnauthorizedError extends ClientError {
  constructor(message: string = "Unauthorized") {
    super(message, 401);
    this.name = "UnauthorizedError";
  }
}

export class ServerError extends Error {
  public statusCode: number;

  constructor(message: string = "Internal server error", statusCode: number = 500) {
    super(message);
    this.name = "ServerError";
    this.statusCode = statusCode;
  }
}

export default ClientError;
