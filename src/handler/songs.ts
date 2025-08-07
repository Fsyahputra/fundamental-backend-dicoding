import autoBind from 'auto-bind';
import type { TResponse } from '../types/shared.js';
import type {
  IServiceSong,
  ISongHandler,
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

  constructor(service: IServiceSong, validator: TSongSchema) {
    this.service = service;
    this.validator = validator;
    autoBind(this);
  }

  public async getSongById(r: R, h: H): Promise<Lf.ReturnValue> {
    const id = r.params['id'];
    const song = await checkIsExist<Song>(`Song with id ${id} not found`, () =>
      this.service.getById(id)
    );
    const response: TResponse = {
      status: 'success',
      data: {
        song,
      },
    };
    return h.response(response).code(200);
  }

  public async postSong(r: R, h: H): Promise<Lf.ReturnValue> {
    const songData = r.payload as SongDTO;
    checkData(songData, this.validator.postSchema);
    const song = await this.service.save(songData);
    const response: TResponse = {
      status: 'success',
      data: {
        songId: song.id,
      },
    };
    return h.response(response).code(201);
  }

  public async deleteSong(r: R, h: H): Promise<Lf.ReturnValue> {
    const id = r.params['id'];
    await checkIsExist<Song>(`Song with id ${id} not found`, () =>
      this.service.getById(id)
    );
    await this.service.delete(id);
    const response: TResponse = {
      status: 'success',
      message: `Song with id ${id} deleted successfully`,
    };
    return h.response(response).code(200);
  }

  public async putSong(r: R, h: H): Promise<Lf.ReturnValue> {
    const id = r.params['id'];
    const songData = r.payload as Partial<SongDTO>;
    checkData(songData, this.validator.putSchema);
    await checkIsExist<Song>(`Song with id ${id} not found`, () =>
      this.service.update(id, songData)
    );
    const response: TResponse = {
      status: 'success',
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
      status: 'success',
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
