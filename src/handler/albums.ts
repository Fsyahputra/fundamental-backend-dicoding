import autoBind from 'auto-bind';
import {
  type Album,
  type AlbumDTO,
  type IAlbumHandler,
  type IAlbumPresentation,
  type IServiceAlbum,
  type TAlbumSchema,
} from '../types/albums.js';
import type {
  Request as R,
  ResponseToolkit as H,
  Lifecycle as Lf,
} from '@hapi/hapi';
import type { IServiceSong } from '../types/songs.js';
import { checkData, checkIsExist } from '../utils.js';

class AlbumHandler implements IAlbumHandler {
  private service: IServiceAlbum;
  private validator: TAlbumSchema;
  private songService: IServiceSong;
  private presentationService: IAlbumPresentation;

  constructor(
    service: IServiceAlbum,
    validator: TAlbumSchema,
    songService: IServiceSong,
    presentationService: IAlbumPresentation
  ) {
    this.service = service;
    this.validator = validator;
    this.songService = songService;
    this.presentationService = presentationService;
    autoBind(this);
  }

  public async getAlbumByid(r: R, h: H): Promise<Lf.ReturnValue> {
    const id = r.params['id'];
    const album = await checkIsExist<Album>(
      `Album with id ${id} not found`,
      () => this.service.getById(id)
    );
    const songs = await this.songService.getByAlbumId(id);
    const response = this.presentationService.getAlbumById(album, songs);
    return h.response(response).code(200);
  }

  public async postAlbum(r: R, h: H): Promise<Lf.ReturnValue> {
    const albumData = r.payload as AlbumDTO;
    checkData(albumData, this.validator.postSchema);
    const album = await this.service.save(albumData);
    const response = this.presentationService.postAlbum(album);
    return h.response(response).code(201);
  }

  public async putAlbum(r: R, h: H): Promise<Lf.ReturnValue> {
    const id = r.params['id'];
    const albumData = r.payload as Partial<AlbumDTO>;
    checkData(albumData, this.validator.putSchema);
    const album = await checkIsExist<Album>(
      `Album with id ${id} not found`,
      () => this.service.update(id, albumData)
    );
    const response = this.presentationService.putAlbum(album);
    return h.response(response).code(200);
  }

  public async deleteAlbum(r: R, h: H): Promise<Lf.ReturnValue> {
    const id = r.params['id'];
    const album = await checkIsExist<Album>(
      `Album with id ${id} not found`,
      () => this.service.delete(id)
    );
    const response = this.presentationService.deleteAlbum(album);
    return h.response(response).code(200);
  }
}

export default AlbumHandler;
