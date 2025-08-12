import type {
  CoverImageResponse,
  ICoverService,
  TCoverDTO,
} from '../types/cover.js';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import ClientError, { NotFoundError } from '../exception.js';
import mime from 'mime-types';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
class CoverService implements ICoverService {
  private uploadPath: string;
  private tempPath: string = path.join(__dirname, 'temp');
  private MAX_SIZE: number = 500 * 1024;
  constructor(
    uploadPath: string = path.join(__dirname, 'uploads'),
    maxSize: number = 500 * 1024
  ) {
    this.uploadPath = uploadPath;
    this.MAX_SIZE = maxSize;
  }

  private moveFileLock = new Map<string, Promise<void>>();
  private async ensureTempPathExists(): Promise<void> {
    if (!fs.existsSync(this.tempPath)) {
      fs.mkdirSync(this.tempPath, { recursive: true });
    }
  }

  private generateCoverFileName(
    albumId: string,
    extension: string = 'jpg'
  ): string {
    return `${albumId}-cover.${extension}`;
  }

  private generateCoverPath(
    uploadPath: string,
    albumId: string,
    extension: string = 'jpg'
  ): string {
    return path.join(
      uploadPath,
      this.generateCoverFileName(albumId, extension)
    );
  }

  private async ensureFileValid(coverData: TCoverDTO): Promise<string> {
    await this.ensureTempPathExists();
    const extension = mime.extension(coverData.mimeType) || 'jpg';
    const tempFileName = this.generateCoverPath(
      this.tempPath,
      coverData.albumId,
      extension
    );
    const fileStream = coverData.file;
    const writeStream = fs.createWriteStream(tempFileName);
    return new Promise<string>((resolve, reject) => {
      let fileSize: number = 0;
      fileStream.on('data', (chunk: Buffer) => {
        fileSize += chunk.length;
        if (fileSize > this.MAX_SIZE) {
          fileStream.destroy();
          writeStream.destroy();
          fs.unlinkSync(tempFileName);
          reject(
            new ClientError('File size exceeds the maximum limit of 500kb', 413)
          );
        }
      });

      fileStream.pipe(writeStream);

      writeStream.on('finish', () => resolve(tempFileName));
      writeStream.on('error', (error) => reject(error));
    });
  }

  private findFileByAlbumId(playlistId: string): string[] {
    const files = fs.readdirSync(this.uploadPath);
    return files.filter((file) => file.startsWith(`${playlistId}-cover.`));
  }

  public async moveFileToUploadPath(
    tempFileName: string,
    albumId: string
  ): Promise<string> {
    const lockKey = `${albumId}-cover`;

    while (this.moveFileLock.has(lockKey)) {
      await this.moveFileLock.get(lockKey);
    }

    let resolver: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      resolver = resolve;
    });

    this.moveFileLock.set(lockKey, lockPromise);
    try {
      const coverPath = this.generateCoverPath(this.uploadPath, albumId);
      const existingFiles = this.findFileByAlbumId(albumId);
      existingFiles.forEach((file) => {
        const filePath = path.join(this.uploadPath, file);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
      fs.renameSync(tempFileName, coverPath);
      return coverPath;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new ClientError(`Failed to move file: ${message}`);
    } finally {
      this.moveFileLock.delete(lockKey);
      resolver!();
    }
  }

  public async saveCoverToDisk(coverData: TCoverDTO): Promise<string> {
    const tempFileName = await this.ensureFileValid(coverData);
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
    await this.moveFileToUploadPath(tempFileName, coverData.albumId);
    const filename = this.generateCoverFileName(
      coverData.albumId,
      mime.extension(coverData.mimeType) || 'jpg'
    );
    return filename;
  }

  public async getCoverFromDisk(albumId: string): Promise<CoverImageResponse> {
    const lockKey = `${albumId}-cover`;

    while (this.moveFileLock.has(lockKey)) {
      await this.moveFileLock.get(lockKey);
    }

    let resolver: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      resolver = resolve;
    });

    this.moveFileLock.set(lockKey, lockPromise);

    try {
      const paths = this.findFileByAlbumId(albumId);
      if (paths.length === 0 || !paths[0]) {
        throw new NotFoundError(
          `Cover for playlist with id ${albumId} not found`
        );
      }
      const foundFile = paths[0];
      const coverFilePath = path.join(this.uploadPath, foundFile);
      const fileBuffer = await fs.promises.readFile(coverFilePath);
      const fileStream = new Readable();
      fileStream._read = () => {};
      fileStream.push(fileBuffer);
      fileStream.push(null);
      const mimeType = mime.lookup(coverFilePath);
      const extension =
        mime.extension(typeof mimeType === 'string' ? mimeType : '') || 'jpg';
      return {
        file: fileStream,
        extension,
        mimeType: typeof mimeType === 'string' ? mimeType : 'image/jpeg',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new ClientError(`Failed to get cover: ${message}`);
    } finally {
      this.moveFileLock.delete(lockKey);
      resolver!();
    }
  }
}

export default CoverService;
