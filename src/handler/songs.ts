import autoBind from 'auto-bind';
import type {
  IServiceSong,
  ISongHandler,
  ISongPresentation,
  queryParams,
  Song,
  SongDTO,
  TSongSchema,
} from '../types/songs.js';
import type {
  Request as R,
  ResponseToolkit as H,
  Lifecycle as Lf,
} from '@hapi/hapi';
import { checkData, checkIsExist, fetchFromCacheOrDefault } from '../utils.js';
import type { ICacheService } from '../types/cache.js';
import { BadRequestError } from '../exception.js';
import SONG from '../constant/songs.js';

class SongHandler implements ISongHandler {
  private service: IServiceSong;
  private validator: TSongSchema;
  private presentationService: ISongPresentation;
  private cacheService: ICacheService;

  constructor(
    service: IServiceSong,
    validator: TSongSchema,
    presentationService: ISongPresentation,
    cacheService: ICacheService
  ) {
    this.service = service;
    this.validator = validator;
    this.presentationService = presentationService;
    this.cacheService = cacheService;
    autoBind(this);
  }

  private async deleteCache(id: string): Promise<void> {
    await this.cacheService.del(SONG.HANDLER.CACHE_KEYS.SONGS_PARAMS);
    await this.cacheService.del(SONG.HANDLER.CACHE_KEYS.SONGS);
    await this.cacheService.del(SONG.HANDLER.CACHE_KEYS.songDetails(id));
  }

  private getSongIdFromRequest(r: R): string {
    const id = r.params['id'];
    if (!id) {
      throw new BadRequestError(SONG.HANDLER.ERROR_MESSAGES.SONG_ID_REQUIRED);
    }
    return id;
  }

  private async getSongByIdFromCacheOrDb(
    id: string
  ): Promise<{ data: Song; fromCache: boolean }> {
    return fetchFromCacheOrDefault<Song>(
      SONG.HANDLER.CACHE_KEYS.songDetails(id),
      this.cacheService,
      () => this.service.getById(id)
    );
  }

  private async getSongByQueryParamsFromCacheOrDb(
    queryParams: queryParams
  ): Promise<{ data: Song[]; fromCache: boolean }> {
    return fetchFromCacheOrDefault<Song[]>(
      SONG.HANDLER.CACHE_KEYS.SONGS,
      this.cacheService,
      () => this.service.getByQueryParams(queryParams)
    );
  }

  public async getSongById(r: R, h: H): Promise<Lf.ReturnValue> {
    const id = this.getSongIdFromRequest(r);
    const { data, fromCache } = await this.getSongByIdFromCacheOrDb(id);
    const response = this.presentationService.getSongById(data);
    const res = h.response(response);
    res.header('X-From-Cache', fromCache ? 'cache' : 'database');
    return res.code(200);
  }

  public async postSong(r: R, h: H): Promise<Lf.ReturnValue> {
    const songData = checkData<SongDTO>(r.payload, this.validator.postSchema);
    const song = await this.service.save(songData);
    await this.deleteCache(song.id);
    const response = this.presentationService.postSong(song);
    return h.response(response).code(201);
  }

  public async deleteSong(r: R, h: H): Promise<Lf.ReturnValue> {
    const id = this.getSongIdFromRequest(r);
    await this.deleteCache(id);
    const song = await checkIsExist<Song>(
      SONG.HANDLER.ERROR_MESSAGES.songNotFound(id),
      () => this.service.delete(id)
    );
    const response = this.presentationService.deleteSong(song);
    return h.response(response).code(200);
  }

  public async putSong(r: R, h: H): Promise<Lf.ReturnValue> {
    const id = this.getSongIdFromRequest(r);
    await this.deleteCache(id);
    const songData = checkData<Partial<SongDTO>>(
      r.payload,
      this.validator.putSchema
    );
    const song = await checkIsExist<Song>(
      SONG.HANDLER.ERROR_MESSAGES.songNotFound(id),
      () => this.service.update(id, songData)
    );
    const response = this.presentationService.putSong(song);
    return h.response(response).code(200);
  }

  public async getSongs(r: R, h: H): Promise<Lf.ReturnValue> {
    let songdata: {
      data: Song[];
      fromCache: boolean;
    };
    const queryParams: queryParams = r.query as queryParams;
    if (Object.keys(queryParams).length > 0) {
      const song = await this.service.getByQueryParams(queryParams);
      songdata = {
        data: song,
        fromCache: false,
      };
    } else {
      songdata = await this.getSongByQueryParamsFromCacheOrDb(queryParams);
    }
    const response = this.presentationService.getSongs(songdata.data);
    const res = h.response(response);
    res.header('X-From-Cache', songdata.fromCache ? 'cache' : 'database');
    res.header('X-Total-Songs', songdata.data.length.toString());
    return res.code(200);
  }
}

export default SongHandler;
