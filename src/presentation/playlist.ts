import type { TActivity, TActivityPresentation } from '../types/activity.js';
import type { PlaylistSong } from '../types/musicCoord.js';
import type {
  IPlaylistPresentation,
  TPlaylist,
  TPlaylistWithOwner,
} from '../types/playlist.js';
import type { TDataResponse, TMessageResponse } from '../types/shared.js';
import type { IServiceSong, Song, TGetSongs } from '../types/songs.js';
import type { IUserService } from '../types/users.js';
import PLAYLIST from '../constant/playlist.js';

class PlaylistPresentation implements IPlaylistPresentation {
  private songService: IServiceSong;
  private userService: IUserService;
  constructor(songService: IServiceSong, userService: IUserService) {
    this.songService = songService;
    this.userService = userService;
  }
  public postPlaylist(
    playlist: TPlaylist
  ): TDataResponse<{ playlistId: string }> {
    return {
      status: 'success',
      data: {
        playlistId: playlist.id,
      },
    };
  }

  public getPlaylist(
    playlist: TPlaylist[],
    usernames: string[]
  ): TDataResponse<{ playlists: TPlaylistWithOwner[] }> {
    const playlistData = playlist.map((p, _) => ({
      id: p.id,
      name: p.name,
    }));

    const playlistsWithOwner = playlistData.map((p, index) => ({
      ...p,
      username: usernames[index] ?? '',
    }));
    return {
      status: 'success',
      data: {
        playlists: playlistsWithOwner,
      },
    };
  }

  public postSongToPlaylist(playlist: TPlaylist, song: Song): TMessageResponse {
    return {
      status: 'success',
      message: PLAYLIST.PRESENTATION_MSG.postSongToPlaylist(
        playlist.id,
        song.id
      ),
    };
  }

  public getSongsbyPlaylistId(
    playlistSong: PlaylistSong<Song>[],
    ownerUsername: string
  ): TDataResponse<{
    playlist: TPlaylistWithOwner & { songs: TGetSongs[] };
  }> {
    const songsData = playlistSong.map((ps) => ({
      id: ps.song.id,
      title: ps.song.title,
      performer: ps.song.performer,
    }));
    const playlistInfo = playlistSong[0]?.playlist;
    const playlistWithOwner: TPlaylistWithOwner = {
      id: playlistInfo?.id ?? '',
      name: playlistInfo?.name ?? '',
      username: ownerUsername,
    };
    return {
      status: 'success',
      data: {
        playlist: {
          ...playlistWithOwner,
          songs: songsData,
        },
      },
    };
  }

  public deletePlaylistById(playlist: TPlaylist): TMessageResponse {
    return {
      status: 'success',
      message: PLAYLIST.PRESENTATION_MSG.deletePlaylistById(playlist.name),
    };
  }

  public deleteSongFromPlaylistId(
    playlist: TPlaylist,
    song: Song
  ): TMessageResponse {
    return {
      status: 'success',
      message: PLAYLIST.PRESENTATION_MSG.deleteSongFromPlaylistId(
        playlist.name,
        song.title
      ),
    };
  }

  private async prepareActivityPresentation(
    activity: TActivity,
    username: string
  ): Promise<TActivityPresentation> {
    const { title } = await this.songService.getById(activity.songId);
    return {
      username,
      title,
      action: activity.action,
      time: activity.time.toISOString(),
    };
  }

  public async getPlaylistActivity(activities: TActivity[]): Promise<
    TDataResponse<{
      playlistId: string;
      activities: TActivityPresentation[];
    }>
  > {
    const userIds = activities.map((activity) => activity.userId);
    const userAcccount = await this.userService.getManyByIds(userIds);
    const usernames = userAcccount.map((user) => user.username);
    const activitiesPresentations = await Promise.all(
      activities.map((activity, index) =>
        this.prepareActivityPresentation(
          activity,
          usernames.length === 1 ? usernames[0] ?? '' : usernames[index] ?? ''
        )
      )
    );

    return {
      status: 'success',
      data: {
        playlistId: activities[0]!.playlistId,
        activities: activitiesPresentations,
      },
    };
  }

  public exportPlaylist(_playlist: TPlaylist): TMessageResponse {
    return {
      status: 'success',
      message: PLAYLIST.PRESENTATION_MSG.EXPORT_PLAYLIST,
    };
  }
}

export default PlaylistPresentation;
