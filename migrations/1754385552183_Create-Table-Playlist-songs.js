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
  pgm.createTable('playlist_songs', {
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
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('playlist_songs');
};
