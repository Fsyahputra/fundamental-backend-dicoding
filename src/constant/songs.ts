const SONG = {
  HANDLER: {
    ERROR_MESSAGES: {
      songNotFound: (id: string): string => `Song with id ${id} not found.`,
      SONG_ID_REQUIRED: 'Song ID is required.',
    },
    CACHE_KEYS: {
      songDetails: (songId: string): string => `songs:${songId}`,
      SONGS: 'songs',
      SONGS_PARAMS: 'songs:Param',
    },
  },
  PRESENTATION_MSG: {
    putSong: (songId: string) => `Song with id ${songId} updated successfully.`,
    deleteSong: (songId: string) =>
      `Song with id ${songId} deleted successfully.`,
  },
  SERVICE: {
    TABLE_NAME: 'songs',
    ID_PREFIX: 'song-',
    ERROR_MESSAGES: {
      songNotFound: (id: string): string => `Song with id ${id} not found.`,
      failedToSave: (songId: string): string =>
        `Failed to save song with id ${songId}.`,
    },
  },
};

export default SONG;
