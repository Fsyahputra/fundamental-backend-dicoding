import Hapi from '@hapi/hapi';
import type { Request } from '@hapi/hapi';
import ClientError from './exception.js';
import plugins from './plugins.js';
import pino from 'pino';
import config from './conf/conf.js';

const port = config.server.port;
const host = config.server.host;

const serverConf: Hapi.ServerOptions = {
  port,
  host,
};

const logger = pino({
  level: 'info',
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
  logger.info(`Server running at: ${server.info.uri}`);
};

await init();
