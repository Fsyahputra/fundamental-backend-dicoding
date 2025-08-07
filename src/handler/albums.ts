import autoBind from "auto-bind";
import { BadRequestError, NotFoundError } from "../exception.js";
import type { AlbumDTO, IAlbumHandler, IServiceAlbum, TAlbumSchema } from "../types/albums.ts";
import type { TResponse } from "../types/shared.ts";
import type { Request as R, ResponseToolkit as H, Lifecycle as Lf } from "@hapi/hapi";
import type { IServiceSong } from "../types/songs.js";

class AlbumHandler implements IAlbumHandler {
  private service: IServiceAlbum;
  private validator: TAlbumSchema;
  private songService: IServiceSong;

  constructor(service: IServiceAlbum, validator: TAlbumSchema, songService: IServiceSong) {
    this.service = service;
    this.validator = validator;
    this.songService = songService;
    autoBind(this);
  }

  public async getAlbumByid(r: R, h: H): Promise<Lf.ReturnValue> {
    const id = r.params["id"];
    const album = await this.service.getById(id);
    if (!album) {
      throw new NotFoundError(`Album with id ${id} not found`);
    }

    const songs = await this.songService.getByAlbumId(id);
    const data = {
      ...album,
      songs: songs.map((song) => ({
        id: song.id,
        title: song.title,
        year: song.year,
        performer: song.performer,
        genre: song.genre,
        duration: song.duration,
      })),
    };
    const response: TResponse = {
      status: "success",
      data: {
        album: data,
      },
    };
    return h.response(response).code(200);
  }

  public async postAlbum(r: R, h: H): Promise<Lf.ReturnValue> {
    const albumData = r.payload as AlbumDTO;
    const { error } = this.validator.postSchema.validate(albumData);
    if (error) {
      throw new BadRequestError(`Invalid album data: ${error.message}`);
    }
    const album = await this.service.save(albumData);
    const response: TResponse = {
      status: "success",
      data: {
        albumId: album.id,
      },
    };
    return h.response(response).code(201);
  }

  public async putAlbum(r: R, h: H): Promise<Lf.ReturnValue> {
    const id = r.params["id"];
    const albumData = r.payload as Partial<AlbumDTO>;
    const { error } = this.validator.putSchema.validate(albumData);
    if (error) {
      throw new BadRequestError(`Invalid album data: ${error.message}`);
    }
    const updatedAlbum = await this.service.update(id, albumData);
    if (!updatedAlbum) {
      throw new NotFoundError(`Album with id ${id} not found`);
    }
    const response: TResponse = {
      status: "success",
      message: `Album with id ${id} updated successfully`,
    };
    return h.response(response).code(200);
  }

  public async deleteAlbum(r: R, h: H): Promise<Lf.ReturnValue> {
    const id = r.params["id"];
    const deletedAlbum = await this.service.delete(id);
    if (!deletedAlbum) {
      throw new NotFoundError(`Album with id ${id} not found`);
    }
    const response: TResponse = {
      status: "success",
      message: `Album with id ${id} deleted successfully`,
    };
    return h.response(response).code(200);
  }
}

export default AlbumHandler;
