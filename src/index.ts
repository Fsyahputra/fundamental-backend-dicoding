import Hapi from '@hapi/hapi';
import dotenv from 'dotenv';
import type { Request } from '@hapi/hapi';
import ClientError from './exception.js';
import plugins from './plugins.js';
import pino from 'pino';

dotenv.config();

const port = process.env['PORT'] || 3000;
const host = 'localhost';

const serverConf: Hapi.ServerOptions = {
  port,
  host,
};

const logger = pino({
  level: process.env['LOG_LEVEL'] || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true, // Warna di terminal
      translateTime: 'SYS:standard', // Format waktu rapi
      ignore: 'pid,hostname', // Hilangkan field yang nggak penting
    },
  },
});

const errorHandler = (r: Request, h: Hapi.ResponseToolkit) => {
  const response = r.response;
  if (response instanceof ClientError) {
    return h
      .response({
        status: 'fail',
        message: response.message,
      })
      .code(response.statusCode);
  }
  if (response instanceof Error) {
    return h
      .response({
        status: 'error',
        message: response.message,
      })
      .code(500);
  }

  return h.continue;
};

const init = async () => {
  const server = Hapi.server(serverConf);

  logger.info('Starting server...');

  // Log global events
  server.events.on('log', (event) => {
    logger.info({ tags: event.tags }, JSON.stringify(event.data));
  });

  server.events.on('request', (request, _event) => {
    logger.info(
      {
        method: request.method,
        path: request.path,
        remote: request.info.remoteAddress,
        payload: request.payload,
        authentication: request.auth.credentials,
      },
      'Incoming request'
    );
  });

  server.ext('onPreResponse', errorHandler);
  for (const plugin of plugins) {
    await server.register(plugin);
  }

  server.route({
    method: 'GET',
    path: '/',
    handler: (_request, h) => {
      return h.response('Hello, OpenMusic!');
    },
  });

  await server.start();
  console.log(`Server running at: ${server.info.uri}`);
};

await init();
