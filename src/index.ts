import Hapi from '@hapi/hapi';
import dotenv from 'dotenv';
import type { Request } from '@hapi/hapi';
import ClientError from './exception.js';
import plugins from './plugins.js';

dotenv.config();

const port = process.env['PORT'] || 3000;
const host = 'localhost';

const serverConf: Hapi.ServerOptions = {
  port,
  host,
};

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
