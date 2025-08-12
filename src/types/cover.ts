import { Readable } from 'stream';

export type TCoverDTO = {
  albumId: string;
  file: Readable;
  mimeType: string;
};

export interface ICoverService {
  saveCoverToDisk: (coverData: TCoverDTO) => Promise<string>;
  getCoverFromDisk: (albumId: string) => Promise<Readable>;
}
