import type { ServerRoute } from "@hapi/hapi";
import type { ICollabhandler } from "../types/collab.js";

const base: string = "/collaborations";

const collabRoutes = (handler: ICollabhandler): ServerRoute[] => [
  {
    method: "POST",
    path: `${base}`,
    handler: handler.postCollab,
  },
  {
    method: "DELETE",
    path: `${base}`,
    handler: handler.deleteCollab,
  },
];

export default collabRoutes;
