const PLAYLIST = {
  HANDLER: {
    ERROR_MESSAGES: {
      playlistNotFound: (id: string): string =>
        `Playlist with id ${id} not found.`,
      OWNER_ACCOUNT_NOT_FOUND: 'Owner account not found',
      forbiddenPlaylist: (id: string): string =>
        `You do not have access to playlist with id ${id}.`,
      TARGET_EMAIL_REQUIRED: 'Target email is required.',
      PLAYLIST_ID_REQUIRED: 'Playlist ID is required.',
      ACTIVITIES_NOT_FOUND: `No activities found for playlist`,
    },
    CACHE_KEYS: {
      userPlaylistsCacheKey: (userId: string): string =>
        `user:${userId}:playlists`,
      playlistSongsCacheKey: (playlistId: string): string =>
        `playlist:${playlistId}:songs`,
    },
  },
  PRESENTATION_MSG: {
    postSongToPlaylist: (playlistId: string, songId: string) =>
      `Song with id ${songId} added to playlist with id ${playlistId} successfully.`,
    deletePlaylistById: (playlistName: string) =>
      `Playlist ${playlistName} deleted successfully.`,
    deleteSongFromPlaylistId: (playlistName: string, songTitle: string) =>
      `Song ${songTitle} removed from playlist ${playlistName}`,
    EXPORT_PLAYLIST: 'Permintaan Anda sedang kami proses',
  },
  SERVICE: {
    TABLE_NAME: 'playlists',
    ID_PREFIX: 'playlist-',
    ERROR_MESSAGES: {
      playlistNotFound: (id: string): string =>
        `Playlist with id ${id} not found.`,
    },
  },
};

export default PLAYLIST;
