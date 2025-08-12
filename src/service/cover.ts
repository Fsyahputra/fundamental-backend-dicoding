import type { ICoverService, TCoverDTO } from '../types/cover.js';
import fs from 'fs';
import path from 'path';
import type { Readable } from 'stream';
import ClientError, { NotFoundError } from '../exception.js';
import mime from 'mime-types';

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

  private async ensureTempPathExists(): Promise<void> {
    if (!fs.existsSync(this.tempPath)) {
      fs.mkdirSync(this.tempPath, { recursive: true });
    }
  }

  private generateCoverFileName(
    uploadPath: string,
    playlistId: string,
    extension: string = 'jpg'
  ): string {
    return path.join(uploadPath, `${playlistId}-cover.${extension}`);
  }

  private async ensureFileValid(coverData: TCoverDTO): Promise<string> {
    await this.ensureTempPathExists();
    const extension = mime.extension(coverData.mimeType) || 'jpg';
    const tempFileName = this.generateCoverFileName(
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
            new ClientError('File size exceeds the maximum limit of 500kb')
          );
        }
      });

      fileStream.pipe(writeStream);

      writeStream.on('finish', () => resolve(tempFileName));
      writeStream.on('error', (error) => reject(error));
    });
  }

  private findFileByPlaylistId(playlistId: string): string[] {
    const files = fs.readdirSync(this.uploadPath);
    return files.filter((file) => file.startsWith(`${playlistId}-cover.`));
  }

  public async moveFileToUploadPath(
    tempFileName: string,
    playlistId: string
  ): Promise<string> {
    const coverPath = this.generateCoverFileName(this.uploadPath, playlistId);
    const existingFiles = this.findFileByPlaylistId(playlistId);
    existingFiles.forEach((file) => {
      const filePath = path.join(this.uploadPath, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
    fs.renameSync(tempFileName, coverPath);
    return coverPath;
  }

  public async saveCoverToDisk(coverData: TCoverDTO): Promise<string> {
    const tempFileName = await this.ensureFileValid(coverData);
    const coverPath = await this.moveFileToUploadPath(
      tempFileName,
      coverData.albumId
    );
    return coverPath;
  }

  public async getCoverFromDisk(playlistId: string): Promise<Readable> {
    const paths = this.findFileByPlaylistId(playlistId);
    if (paths.length === 0 || !paths[0]) {
      throw new NotFoundError(
        `Cover for playlist with id ${playlistId} not found`
      );
    }
    const foundFile = paths[0];
    const coverFilePath = path.join(this.uploadPath, foundFile);
    return fs.createReadStream(coverFilePath);
  }
}

export default CoverService;
