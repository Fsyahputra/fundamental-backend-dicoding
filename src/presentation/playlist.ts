import type { TActivity, TActivityPresentation } from '../types/activity.js';
import type {
  IPlaylistPresentation,
  TPlaylist,
  TPlaylistWithOwner,
} from '../types/playlist.js';
import type { TDataResponse, TMessageResponse } from '../types/shared.js';
import type { Song, TGetSongs } from '../types/songs.js';

class PlaylistPresentation implements IPlaylistPresentation {
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
      message: `Song ${song.title} added to playlist ${playlist.name}`,
    };
  }

  public getSongsbyPlaylistId(
    song: Song[],
    playlist: TPlaylist,
    ownerUsername: string
  ): TDataResponse<{
    playlist: TPlaylistWithOwner & { songs: TGetSongs[] };
  }> {
    const songsData = song.map((s) => ({
      id: s.id,
      title: s.title,
      performer: s.performer,
    }));

    const playlistWithOwner: TPlaylistWithOwner = {
      id: playlist.id,
      name: playlist.name,
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
      message: `Playlist ${playlist.name} deleted successfully`,
    };
  }

  public deleteSongFromPlaylistId(
    playlist: TPlaylist,
    song: Song
  ): TMessageResponse {
    return {
      status: 'success',
      message: `Song ${song.title} removed from playlist ${playlist.name}`,
    };
  }

  public getPlaylistActivity(
    activities: TActivity[],
    playlist: TPlaylist,
    usernames: string[],
    titles: string[]
  ): TDataResponse<{
    playlistId: string;
    activities: TActivityPresentation[];
  }> {
    const activitiesWithUsernames: TActivityPresentation[] = activities.map(
      (activity, index) => ({
        action: activity.action,
        title: titles[index] ?? '',
        time: activity.time.toISOString(),
        username: usernames[index] ?? '',
      })
    );

    return {
      status: 'success',
      data: {
        playlistId: playlist.id,
        activities: activitiesWithUsernames,
      },
    };
  }
}

export default PlaylistPresentation;
