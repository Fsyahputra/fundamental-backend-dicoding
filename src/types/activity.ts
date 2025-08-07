export type TActivityDTO = {
  userId: string;
  playlistId: string;
  songId: string;
  action: "add" | "delete";
};

export type TActivity = TActivityDTO & {
  id: string;
  time: Date;
};

export type TActivityPresentation = {
  username: string;
  title: string;
  action: "add" | "delete";
  time: string;
};

export interface IActivityService {
  addActivity: (activity: TActivityDTO) => Promise<TActivity>;
  getActivitiesByPlaylistId: (playlistId: string) => Promise<TActivity[]>;
}
