import { Readable } from 'stream';

export type TCoverDTO = {
  albumId: string;
  file: Readable;
  mimeType: string;
};

export type CoverImageResponse = {
  file: Readable;
  extension: string;
  mimeType: string;
};
export interface ICoverService {
  saveCoverToDisk: (coverData: TCoverDTO) => Promise<string>;
  getCoverFromDisk: (albumId: string) => Promise<CoverImageResponse>;
}
