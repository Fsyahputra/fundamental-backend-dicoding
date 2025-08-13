import dotenv from 'dotenv';
dotenv.config();

const config = {
  server: {
    port: Number(process.env['PORT']) || 5000,
    host: process.env['HOST'] || 'localhost',
  },
  pg: {
    pgUser: process.env['PG_USER'],
    pgPassword: process.env['PG_PASSWORD'],
    pgHost: process.env['PG_HOST'],
    pgDatabase: process.env['PG_DATABASE'],
    pgPort: Number(process.env['PG_PORT']) || 5432,
  },
  mailer: {
    smtpHost: process.env['SMTP_HOST'] || 'localhost',
    smtpPort: Number(process.env['SMTP_PORT']) || 587,
    smtpUser: process.env['SMTP_USER'] || 'user',
    smtpPassword: process.env['SMTP_PASSWORD'] || 'password',
  },
  coverUploadPath: process.env['COVER_UPLOAD_PATH'] || './uploads/covers',
  token: {
    accessTokenSecret:
      process.env['ACCESS_TOKEN_KEY'] || 'defaultAccessTokenKey',
    refreshTokenSecret:
      process.env['REFRESH_TOKEN_KEY'] || 'defaultRefreshTokenKey',
  },
  rabbitmq: {
    exportQueue: process.env['RABBIT_QUEUE_NAME'] || 'export:playlist',
    url: process.env['RABBITMQ_SERVER'] || 'amqp://localhost:5672',
  },
  redis: {
    url: process.env['REDIS_SERVER'] || 'redis://localhost:6379',
    ttl: Number(process.env['REDIS_TTL']) || 1800, // default 30 minutes
  },
};

export default config;
