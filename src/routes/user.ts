import type { ServerRoute } from "@hapi/hapi";
import type { IUserHandler } from "../types/users.js";

const userRoutes = (userHandler: IUserHandler): ServerRoute[] => [
  {
    method: "POST",
    path: "/users",
    handler: userHandler.registerUser,
    options: {
      auth: false,
    },
  },

  {
    method: "POST",
    path: "/authentications",
    handler: userHandler.authenticateUser,
    options: {
      auth: false,
    },
  },

  {
    method: "PUT",
    path: "/authentications",
    handler: userHandler.reAuthenticateUser,
    options: {
      auth: false,
    },
  },
  {
    method: "DELETE",
    path: "/authentications",
    handler: userHandler.deauthenticateUser,
    options: {
      auth: false,
    },
  },
];

export default userRoutes;
