import dotenv from 'dotenv';
dotenv.config();

const config = {
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
  url: {
    rabbitMqUrl: process.env['RABBITMQ_SERVER'] || 'amqp://localhost:5672',
    redisUrl: process.env['REDIS_SERVER'] || 'redis://localhost:6379',
  },
  coverUploadPath: process.env['COVER_UPLOAD_PATH'] || './uploads/covers',
  token: {
    accessTokenSecret:
      process.env['ACCESS_TOKEN_KEY'] || 'defaultAccessTokenKey',
    refreshTokenSecret:
      process.env['REFRESH_TOKEN_KEY'] || 'defaultRefreshTokenKey',
  },
};

export default config;
