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

  public async getSongById(r: R, h: H): Promise<Lf.ReturnValue> {
    const id = r.params['id'];
    const { data, fromCache } = await fetchFromCacheOrDefault<Song>(
      `songs:${id}`,
      this.cacheService,
      () => this.service.getById(id)
    );
    const response = this.presentationService.getSongById(data);
    const res = h.response(response);
    res.header('X-From-Cache', fromCache ? 'true' : 'false');
    return res.code(200);
  }

  public async postSong(r: R, h: H): Promise<Lf.ReturnValue> {
    const songData = checkData<SongDTO>(r.payload, this.validator.postSchema);
    await this.cacheService.del('songs:Param');
    await this.cacheService.del(`songs`);
    const song = await this.service.save(songData);
    await this.cacheService.del(`songs:${song.id}`);
    const response = this.presentationService.postSong(song);
    return h.response(response).code(201);
  }

  public async deleteSong(r: R, h: H): Promise<Lf.ReturnValue> {
    const id = r.params['id'];
    await this.cacheService.del('songs:Param');
    await this.cacheService.del(`songs`);
    await this.cacheService.del(`songs:${id}`);
    await checkIsExist<Song>(`Song with id ${id} not found`, () =>
      this.service.getById(id)
    );
    await this.service.delete(id);
    const response = this.presentationService.deleteSong(id);
    return h.response(response).code(200);
  }

  public async putSong(r: R, h: H): Promise<Lf.ReturnValue> {
    const id = r.params['id'];
    await this.cacheService.del('songs:Param');
    await this.cacheService.del(`songs`);
    await this.cacheService.del(`songs:${id}`);
    const songData = checkData<Partial<SongDTO>>(
      r.payload,
      this.validator.putSchema
    );
    const song = await checkIsExist<Song>(`Song with id ${id} not found`, () =>
      this.service.update(id, songData)
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
      songdata = await fetchFromCacheOrDefault<Song[]>(
        `songs`,
        this.cacheService,
        () => this.service.getByQueryParams(queryParams)
      );
    }
    const response = this.presentationService.getSongs(songdata.data);
    const res = h.response(response);
    res.header('X-From-Cache', songdata.fromCache ? 'true' : 'false');
    res.header('X-Total-Songs', songdata.data.length.toString());
    return res.code(200);
  }
}

export default SongHandler;
