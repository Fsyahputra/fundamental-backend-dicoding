import autoBind from "auto-bind";
import type { ICollabhandler, ICollabService, TCollabDTO } from "../types/collab.js";
import type { TResponse } from "../types/shared.js";
import type { Request as R, ResponseToolkit as H, Lifecycle as Lf } from "@hapi/hapi";
import type { IUserService } from "../types/users.js";
import { ForbiddenError, NotFoundError } from "../exception.js";
import type { IPlayListService } from "../types/playlist.js";

class CollabHandler implements ICollabhandler {
  private collabService: ICollabService;
  private userService: IUserService;
  private playlistService: IPlayListService;

  constructor(collabService: ICollabService, userService: IUserService, playlistService: IPlayListService) {
    this.collabService = collabService;
    this.userService = userService;
    this.playlistService = playlistService;
    autoBind(this);
  }

  public async postCollab(r: R, h: H): Promise<Lf.ReturnValue> {
    const { playlistId, userId } = r.payload as TCollabDTO;
    const collabData: TCollabDTO = { playlistId, userId };
    const playlist = await this.playlistService.getById(playlistId);
    if (!playlist) {
      throw new NotFoundError(`Playlist with id ${playlistId} not found`);
    }
    const user = await this.userService.getById(userId);
    if (!user) {
      throw new NotFoundError(`User with id ${userId} not found`);
    }
    const { id } = r.auth.credentials.user as { id: string };

    if (playlist.owner !== id) {
      throw new ForbiddenError(`User with id ${userId} is not the owner of playlist with id ${playlistId}`);
    }

    const collab = await this.collabService.addCollab(collabData);

    const response: TResponse = {
      status: "success",
      data: {
        collaborationId: collab.id,
      },
    };
    return h.response(response).code(201);
  }

  public async deleteCollab(r: R, h: H): Promise<Lf.ReturnValue> {
    const { playlistId, userId } = r.payload as TCollabDTO;
    const cred = r.auth.credentials.user as { id: string };
    const id = cred.id;
    const collabData: TCollabDTO = { playlistId, userId };
    const playlist = await this.playlistService.getById(playlistId);
    if (!playlist) {
      throw new NotFoundError(`Playlist with id ${playlistId} not found`);
    }
    if (playlist.owner !== id) {
      throw new ForbiddenError(`You do not have permission to remove collaborations from this playlist`);
    }
    const collab = await this.collabService.removeCollab(collabData);
    const response: TResponse = {
      status: "success",
      message: `Collaboration with id ${collab.id} removed successfully`,
    };
    return h.response(response).code(200);
  }
}

export default CollabHandler;
