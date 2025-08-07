/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createTable('users', {
    id: {
      type: 'TEXT',
      primaryKey: true,
    },
    username: {
      type: 'TEXT',
      notNull: true,
      unique: true,
    },
    password: {
      type: 'TEXT',
      notNull: true,
    },
    fullname: {
      type: 'TEXT',
      notNull: true,
    },
  });

  pgm.createTable('playlists', {
    id: {
      type: 'TEXT',
      primaryKey: true,
    },
    name: {
      type: 'TEXT',
      notNull: true,
    },
    owner: {
      type: 'TEXT',
      references: 'users(id)',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      notNull: false,
    },
  });

  pgm.createTable('playlist_songs_activities', {
    id: {
      type: 'TEXT',
      primaryKey: true,
    },
    playlist_id: {
      type: 'TEXT',
      references: 'playlists(id)',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      notNull: true,
    },
    song_id: {
      type: 'TEXT',
      references: 'songs(id)',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      notNull: true,
    },
    user_id: {
      type: 'TEXT',
      references: 'users(id)',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      notNull: true,
    },

    action: {
      type: 'TEXT',
      notNull: true,
      check: "action IN ('add', 'delete')",
    },
    time: {
      type: 'TIMESTAMP',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createTable('collaborations', {
    id: {
      type: 'TEXT',
      primaryKey: true,
    },
    playlist_id: {
      type: 'TEXT',
      references: 'playlists(id)',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      notNull: true,
    },
    user_id: {
      type: 'TEXT',
      references: 'users(id)',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      notNull: true,
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('collaborations');
  pgm.dropTable('playlist_songs_activities');
  pgm.dropTable('playlists');
  pgm.dropTable('users');
  pgm.dropTable('songs');
  pgm.dropTable('albums');
};
