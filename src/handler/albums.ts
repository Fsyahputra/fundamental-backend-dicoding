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
import { checkData, checkIsExist, fetchFromCacheOrDefault } from '../utils.js';
import type { IAlbumLikesService } from '../types/albumLikes.js';
import type { IAuthorizationService } from '../types/authorization.js';
import type { ICoverService, TCoverDTO } from '../types/cover.js';
import type { ICacheService } from '../types/cache.js';
import ALBUM from '../constant/albums.js';

class AlbumHandler implements IAlbumHandler {
  private service: IServiceAlbum;
  private validator: TAlbumSchema;
  private songService: IServiceSong;
  private presentationService: IAlbumPresentation;
  private likesService: IAlbumLikesService;
  private authorizationService: IAuthorizationService;
  private coverService: ICoverService;
  private cacheService: ICacheService;
  private hostname: string;
  private port: number;

  constructor(deps: TAlbumDeps) {
    this.service = deps.albumService;
    this.validator = deps.validator;
    this.songService = deps.songService;
    this.presentationService = deps.albumPresentation;
    this.likesService = deps.albumLikesService;
    this.authorizationService = deps.authorizationService;
    this.coverService = deps.coverService;
    this.cacheService = deps.cacheService;
    this.hostname = deps.hostname;
    this.port = deps.port;
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

      await this.ensureAlbumExists(
        (id) =>
          this.service.update(id, { coverUrl: this.generateCoverUrl(id) }),
        albumId
      );
    }
  }

  private async getLikesCacheWithFallback(
    key: string,
    id: string
  ): Promise<{ data: number; fromCache: boolean }> {
    const { data, fromCache } = await fetchFromCacheOrDefault<number>(
      key,
      this.cacheService,
      () => this.likesService.getLikesCount(id)
    );
    const res = { data, fromCache };
    return res;
  }

  private async ensureAlbumExists(
    method: (id: string) => Promise<Album | null>,
    id: string
  ): Promise<Album> {
    const album = checkIsExist<Album>(
      ALBUM.HANDLER.ERROR_MESSAGES.albumNotFound(id),
      () => method(id)
    );
    return album;
  }

  private getAlbumIdFromRequest(r: R): string {
    const id = r.params['id'];
    if (!id) {
      throw new Error(ALBUM.HANDLER.ERROR_MESSAGES.ALBUM_ID_REQUIRED);
    }
    return id;
  }

  private generateCoverUrl(albumId: string): string {
    return `http://${this.hostname}:${this.port}/albums/${albumId}/covers`;
  }

  public async getAlbumById(r: R, h: H): Promise<Lf.ReturnValue> {
    const id = this.getAlbumIdFromRequest(r);
    const album = await this.ensureAlbumExists(
      (id) => this.service.getById(id),
      id
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

    const album = await this.ensureAlbumExists(
      (id) => this.service.update(id, value),
      id
    );
    const response = this.presentationService.putAlbum(album);
    return h.response(response).code(200);
  }

  public async deleteAlbum(r: R, h: H): Promise<Lf.ReturnValue> {
    const id = this.getAlbumIdFromRequest(r);
    const album = await this.ensureAlbumExists(
      (id) => this.service.delete(id),
      id
    );
    const response = this.presentationService.deleteAlbum(album);
    return h.response(response).code(200);
  }

  public async postLike(r: R, h: H): Promise<Lf.ReturnValue> {
    const id = this.getAlbumIdFromRequest(r);
    const userId = this.authorizationService.getUserIdFromRequest(r);
    const album = await this.ensureAlbumExists(
      (id) => this.service.getById(id),
      id
    );
    await this.cacheService.del(ALBUM.HANDLER.CACHE_KEYS.likesCount(id));
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
    const album = await this.ensureAlbumExists(
      (id) => this.service.getById(id),
      id
    );
    await this.cacheService.del(ALBUM.HANDLER.CACHE_KEYS.likesCount(id));
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
    const album = await this.ensureAlbumExists(
      (id) => this.service.update(id, { coverUrl: coverUrl }),
      id
    );
    const response = this.presentationService.postCover(album);
    return h.response(response).code(201);
  }

  public async getLikeCount(r: R, h: H): Promise<Lf.ReturnValue> {
    const id = this.getAlbumIdFromRequest(r);
    await this.ensureAlbumExists((id) => this.service.getById(id), id);
    const { data, fromCache: cacheUsed } = await this.getLikesCacheWithFallback(
      ALBUM.HANDLER.CACHE_KEYS.likesCount(id),
      id
    );
    const response = this.presentationService.getLikeCount(data);
    const res = h.response(response).code(200);
    res.header('X-Data-source', cacheUsed ? 'cache' : '');
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
