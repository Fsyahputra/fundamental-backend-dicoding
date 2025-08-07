import autoBind from "auto-bind";
import { BadRequestError, NotFoundError } from "../exception.js";
import type { IPlaylistServiceCoord, PlaylistSong } from "../types/musicCoord.js";
import type { IPlayListService } from "../types/playlist.js";
import type { IPlaylistSongService } from "../types/playlistSons.js";
import type { IServiceSong, Song } from "../types/songs.js";

class MusicCoordService implements IPlaylistServiceCoord {
  private playlistService: IPlayListService;
  private playlistSongService: IPlaylistSongService;
  private songService: IServiceSong;

  constructor(playlistService: IPlayListService, songService: IServiceSong, playlistSongService: IPlaylistSongService) {
    this.playlistService = playlistService;
    this.songService = songService;
    this.playlistSongService = playlistSongService;
    autoBind(this);
  }

  public async addSongToPlaylist(playListId: string, songId: string): Promise<PlaylistSong<Song>> {
    const playList = await this.playlistService.getById(playListId);
    if (!playList) {
      throw new BadRequestError(`Playlist with id ${playListId} not found`);
    }
    let song: Song;
    try {
      song = await this.songService.getById(songId);
    } catch (error) {
      throw new NotFoundError(`Song with id ${songId} not found`);
    }
    await this.playlistSongService.save({ playlistId: playListId, songId });
    return {
      song,
      playlist: playList,
    };
  }

  public async removeSongFromPlaylist(playListId: string, songId: string): Promise<void> {
    const playList = await this.playlistService.getById(playListId);
    if (!playList) {
      throw new BadRequestError(`Playlist with id ${playListId} not found`);
    }
    let song: Song;
    try {
      song = await this.songService.getById(songId);
    } catch (error) {
      throw new BadRequestError(`Song with id ${songId} not found`);
    }
    if (!song) {
      throw new BadRequestError(`Song with id ${songId} not found`);
    }

    await this.playlistSongService.delete(playListId, songId);
  }

  public async getSongsInPlaylist(playListId: string): Promise<PlaylistSong<Song>[]> {
    const playList = await this.playlistService.getById(playListId);
    if (!playList) {
      throw new NotFoundError(`Playlist with id ${playListId} not found`);
    }

    const songs = await this.songService.getByPlaylistId(playListId);
    return songs.map((song) => ({
      song,
      playlist: playList,
    }));
  }
}

export default MusicCoordService;
