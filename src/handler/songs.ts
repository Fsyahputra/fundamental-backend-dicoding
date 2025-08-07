import autoBind from "auto-bind";
import { BadRequestError, NotFoundError } from "../exception.js";
import type { TResponse } from "../types/shared.js";
import type { IServiceSong, ISongHandler, queryParams, Song, SongDTO, TSongSchema } from "../types/songs.js";
import type { Request as R, ResponseToolkit as H, Lifecycle as Lf } from "@hapi/hapi";

class SongHandler implements ISongHandler {
  private service: IServiceSong;
  private validator: TSongSchema;

  constructor(service: IServiceSong, validator: TSongSchema) {
    this.service = service;
    this.validator = validator;
    autoBind(this);
  }

  public async getSongById(r: R, h: H): Promise<Lf.ReturnValue> {
    const id = r.params["id"];

    const song = await this.service.getById(id);
    if (!song) {
      throw new NotFoundError(`Song with id ${id} not found`);
    }
    const response: TResponse = {
      status: "success",
      data: {
        song,
      },
    };
    return h.response(response).code(200);
  }

  public async postSong(r: R, h: H): Promise<Lf.ReturnValue> {
    const songData = r.payload as SongDTO;
    const { error } = this.validator.postSchema.validate(songData);
    if (error) {
      throw new BadRequestError(`Invalid song data: ${error.message}`);
    }
    const song = await this.service.save(songData);
    const response: TResponse = {
      status: "success",
      data: {
        songId: song.id,
      },
    };
    return h.response(response).code(201);
  }

  public async deleteSong(r: R, h: H): Promise<Lf.ReturnValue> {
    const id = r.params["id"];
    const song = await this.service.getById(id);
    if (!song) {
      throw new NotFoundError(`Song with id ${id} not found`);
    }
    await this.service.delete(id);
    const response: TResponse = {
      status: "success",
      message: `Song with id ${id} deleted successfully`,
    };
    return h.response(response).code(200);
  }

  public async putSong(r: R, h: H): Promise<Lf.ReturnValue> {
    const id = r.params["id"];
    const songData = r.payload as Partial<SongDTO>;
    const { error } = this.validator.putSchema.validate(songData);
    if (error) {
      throw new BadRequestError(`Invalid song data: ${error.message}`);
    }
    const updatedSong = await this.service.update(id, songData);
    if (!updatedSong) {
      throw new NotFoundError(`Song with id ${id} not found`);
    }
    const response: TResponse = {
      status: "success",
      message: `Song with id ${id} updated successfully`,
    };
    return h.response(response).code(200);
  }

  public async getSongs(r: R, h: H): Promise<Lf.ReturnValue> {
    let songs: Song[] = [];
    const queryParams: queryParams = r.query as queryParams;
    if (Object.keys(queryParams).length > 0) {
      songs = await this.service.getByQueryParams(queryParams);
    } else {
      songs = await this.service.getAll();
    }
    const response: TResponse = {
      status: "success",
      data: {
        songs: songs.map((song) => ({
          id: song.id,
          title: song.title,
          performer: song.performer,
        })),
      },
    };
    return h.response(response).code(200);
  }
}

export default SongHandler;
