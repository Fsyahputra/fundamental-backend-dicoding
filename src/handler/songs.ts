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
import { checkData, checkIsExist } from '../utils.js';

class SongHandler implements ISongHandler {
  private service: IServiceSong;
  private validator: TSongSchema;
  private presentationService: ISongPresentation;

  constructor(
    service: IServiceSong,
    validator: TSongSchema,
    presentationService: ISongPresentation
  ) {
    this.service = service;
    this.validator = validator;
    this.presentationService = presentationService;
    autoBind(this);
  }

  public async getSongById(r: R, h: H): Promise<Lf.ReturnValue> {
    const id = r.params['id'];
    const song = await checkIsExist<Song>(`Song with id ${id} not found`, () =>
      this.service.getById(id)
    );
    const response = this.presentationService.getSongById(song);
    return h.response(response).code(200);
  }

  public async postSong(r: R, h: H): Promise<Lf.ReturnValue> {
    const songData = checkData<SongDTO>(r.payload, this.validator.postSchema);
    const song = await this.service.save(songData);
    const response = this.presentationService.postSong(song);
    return h.response(response).code(201);
  }

  public async deleteSong(r: R, h: H): Promise<Lf.ReturnValue> {
    const id = r.params['id'];
    await checkIsExist<Song>(`Song with id ${id} not found`, () =>
      this.service.getById(id)
    );
    await this.service.delete(id);
    const response = this.presentationService.deleteSong(id);
    return h.response(response).code(200);
  }

  public async putSong(r: R, h: H): Promise<Lf.ReturnValue> {
    const id = r.params['id'];
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
    let songs: Song[] = [];
    const queryParams: queryParams = r.query as queryParams;
    if (Object.keys(queryParams).length > 0) {
      songs = await this.service.getByQueryParams(queryParams);
    } else {
      songs = await this.service.getAll();
    }
    const response = this.presentationService.getSongs(songs);
    return h.response(response).code(200);
  }
}

export default SongHandler;
