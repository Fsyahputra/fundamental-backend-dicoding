const COLLAB = {
  HANDLER: {
    ERROR_MESSAGES: {
      playlistNotFound: (id: string): string =>
        `Playlist with id ${id} not found.`,
      userNotFound: (id: string): string => `User with id ${id} not found.`,
    },
    CACHE_KEYS: {
      usersPlaylists: (userId: string): string => `user:${userId}:playlists`,
    },
  },
  PRESENTATION_MSG: {
    deleteCollab: (collabId: string) =>
      `Collaboration with id ${collabId} deleted successfully.`,
  },
  SERVICE: {
    TABLE_NAME: 'collaborations',
    ID_PREFIX: 'collab-',
    ERROR_MESSAGES: {
      COLLABORATION_NOT_FOUND: 'Collaboration not found',
    },
  },
};

export default COLLAB;
