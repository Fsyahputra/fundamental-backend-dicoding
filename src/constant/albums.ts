const ALBUM = {
  HANDLER: {
    ERROR_MESSAGES: {
      albumNotFound: (id: string): string => `Album with id ${id} not found.`,
      ALBUM_ID_REQUIRED: 'Album ID is required.',
    },
    CACHE_KEYS: {
      likesCount: (id: string): string => `album:${id}:likesCount`,
    },
  },
  PRESENTATION_MSG: {
    putAlbum: (id: string) => `Album with id ${id} updated successfully.`,
    deleteAlbum: (id: string) => `Album with id ${id} deleted successfully.`,
    postLike: (id: string) => `Album with id ${id} liked successfully.`,
    deleteLike: (id: string) =>
      `Like removed from album with id ${id} successfully.`,
    POST_COVER: 'Sampul berhasil diunggah',
  },
  SERVICE: {
    TABLE_NAME: 'albums',
    ID_PREFIX: 'album-',
    ERROR_MESSAGES: {
      NOTHING_TO_UPDATE: 'Nothing to update',
    },
  },
};

export default ALBUM;
