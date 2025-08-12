import autoBind from 'auto-bind';
import {
  type Album,
  type AlbumDTO,
  type IAlbumHandler,
  type IAlbumPresentation,
  type IServiceAlbum,
  type TAlbumDeps,
  type TAlbumSchema,
} from '../types/albums.js';
import type {
  Request as R,
  ResponseToolkit as H,
  Lifecycle as Lf,
} from '@hapi/hapi';
import type { IServiceSong } from '../types/songs.js';
import { checkData, checkIsExist } from '../utils.js';
import type { IAlbumLikesService } from '../types/albumLikes.js';
import type { IAuthorizationService } from '../types/authorization.js';
import type { ICoverService, TCoverDTO } from '../types/cover.js';
import type { ICacheService } from '../types/cache.js';

class AlbumHandler implements IAlbumHandler {
  private service: IServiceAlbum;
  private validator: TAlbumSchema;
  private songService: IServiceSong;
  private presentationService: IAlbumPresentation;
  private likesService: IAlbumLikesService;
  private authorizationService: IAuthorizationService;
  private coverService: ICoverService;
  private cacheService: ICacheService;

  constructor(deps: TAlbumDeps) {
    this.service = deps.albumService;
    this.validator = deps.validator;
    this.songService = deps.songService;
    this.presentationService = deps.albumPresentation;
    this.likesService = deps.albumLikesService;
    this.authorizationService = deps.authorizationService;
    this.coverService = deps.coverService;
    this.cacheService = deps.cacheService;
    autoBind(this);
  }

  private async handleCoverUploadIfExists(payload: any, albumId: string) {
    if (typeof payload === 'object' && payload !== null && 'cover' in payload) {
      const data = checkData<any>(payload, this.validator.postCoverSchema);
      const mimeType = data.cover.hapi.headers['content-type'];

      const coverData: TCoverDTO = {
        albumId,
        file: data.cover,
        mimeType,
      };
      await this.coverService.saveCoverToDisk(coverData);

      await checkIsExist<Album>(`Album with id ${albumId} not found`, () =>
        this.service.update(albumId, {
          coverUrl: this.generateCoverUrl(albumId),
        })
      );
    }
  }

  private getAlbumIdFromRequest(r: R): string {
    const id = r.params['id'];
    if (!id) {
      throw new Error('Album ID is required');
    }
    return id;
  }

  private generateCoverUrl(albumId: string): string {
    return `http://localhost:5000/albums/${albumId}/covers`;
  }

  public async getAlbumById(r: R, h: H): Promise<Lf.ReturnValue> {
    const id = this.getAlbumIdFromRequest(r);
    const album = await checkIsExist<Album>(
      `Album with id ${id} not found`,
      () => this.service.getById(id)
    );
    const songs = await this.songService.getByAlbumId(id);
    const response = this.presentationService.getAlbumById(album, songs);
    return h.response(response).code(200);
  }

  public async postAlbum(r: R, h: H): Promise<Lf.ReturnValue> {
    const albumData = checkData<AlbumDTO>(r.payload, this.validator.postSchema);
    const album = await this.service.save(albumData);
    await this.handleCoverUploadIfExists(r.payload, album.id);
    const response = this.presentationService.postAlbum(album);
    return h.response(response).code(201);
  }

  public async putAlbum(r: R, h: H): Promise<Lf.ReturnValue> {
    const id = this.getAlbumIdFromRequest(r);

    const value = checkData<Partial<AlbumDTO>>(
      r.payload,
      this.validator.putSchema
    );

    const album = await checkIsExist<Album>(
      `Album with id ${id} not found`,
      () => this.service.update(id, value)
    );
    const response = this.presentationService.putAlbum(album);
    return h.response(response).code(200);
  }

  public async deleteAlbum(r: R, h: H): Promise<Lf.ReturnValue> {
    const id = this.getAlbumIdFromRequest(r);
    const album = await checkIsExist<Album>(
      `Album with id ${id} not found`,
      () => this.service.delete(id)
    );
    const response = this.presentationService.deleteAlbum(album);
    return h.response(response).code(200);
  }

  public async postLike(r: R, h: H): Promise<Lf.ReturnValue> {
    const id = this.getAlbumIdFromRequest(r);
    const userId = this.authorizationService.getUserIdFromRequest(r);
    const album = await checkIsExist<Album>(
      `Album with id ${id} not found`,
      () => this.service.getById(id)
    );
    await this.cacheService.del(`album:${id}:likesCount`);
    await this.likesService.addLike({
      userId,
      albumId: id,
    });
    const response = this.presentationService.postLike(album);
    return h.response(response).code(201);
  }

  public async deleteLike(r: R, h: H): Promise<Lf.ReturnValue> {
    const userId = this.authorizationService.getUserIdFromRequest(r);
    const id = this.getAlbumIdFromRequest(r);
    const album = await checkIsExist<Album>(
      `Album with id ${id} not found`,
      () => this.service.getById(id)
    );
    await this.cacheService.del(`album:${id}:likesCount`);
    await this.likesService.deleteLike({
      userId,
      albumId: id,
    });
    const response = this.presentationService.deleteLike(album);
    return h.response(response).code(200);
  }

  public async postCover(r: R, h: H): Promise<Lf.ReturnValue> {
    const id = this.getAlbumIdFromRequest(r);
    const data = checkData<any>(r.payload, this.validator.postCoverSchema);

    const mimeType = data.cover.hapi.headers['content-type'];
    const coverData: TCoverDTO = {
      albumId: id,
      file: data.cover,
      mimeType,
    };
    const coverUrl = this.generateCoverUrl(id);
    await this.coverService.saveCoverToDisk(coverData);
    const album = await checkIsExist<Album>(
      `Album with id ${id} not found`,
      () => this.service.update(id, { coverUrl: coverUrl })
    );
    console.log(album);
    const response = this.presentationService.postCover(album);
    return h.response(response).code(201);
  }

  public async getLikeCount(r: R, h: H): Promise<Lf.ReturnValue> {
    let likesCount: number | null = 0;
    const id = this.getAlbumIdFromRequest(r);
    await checkIsExist<Album>(`Album with id ${id} not found`, () =>
      this.service.getById(id)
    );
    let fromCache: boolean = true;
    likesCount = await this.cacheService.get<number>(`album:${id}:likesCount`);
    if (likesCount === null) {
      likesCount = await this.likesService.getLikesCount(id);
      fromCache = false;
      await this.cacheService.set(`album:${id}:likesCount`, likesCount);
    }

    const response = this.presentationService.getLikeCount(likesCount);
    const res = h.response(response).code(200);
    res.header('X-Data-source', fromCache ? 'cache' : '');
    return res;
  }

  public async getCoverById(r: R, h: H): Promise<Lf.ReturnValue> {
    const id = this.getAlbumIdFromRequest(r);
    const cover = await this.coverService.getCoverFromDisk(id);
    return h
      .response(cover.file)
      .type(cover.mimeType)
      .header(
        'Content-Disposition',
        `inline; filename="${id}.${cover.extension}"`
      )
      .code(200);
  }
}

export default AlbumHandler;
