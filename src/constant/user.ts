const USER = {
  HANDLER: {
    ERROR_MESSAGES: {
      userNotFound: (id: string): string => `User with id ${id} not found.`,
    },
  },
  PRESENTATION_MSG: {
    deauthenticateUser: (refreshToken: string) =>
      `User with token ${refreshToken} has been deauthenticated.`,
  },
  SERVICE: {
    TABLE_NAME: 'users',
    ID_PREFIX: 'user-',
    ERROR_MESSAGES: {
      userNotFound: (id: string): string => `User with id ${id} not found.`,
      failedToSave: (userId: string): string =>
        `Failed to save user with id ${userId}.`,
    },
  },
};

export default USER;
