export interface TAlbumLikesDTO {
  userId: string;
  albumId: string;
}

export interface TAlbumLikes extends TAlbumLikesDTO {
  id: string;
}

export interface IAlbumLikesService {
  addLike: (like: TAlbumLikesDTO) => Promise<TAlbumLikes>;
  deleteLike: (like: TAlbumLikesDTO) => Promise<void>;
  isLikedByUser: (userId: string, albumId: string) => Promise<boolean>;
  getLikesCount: (albumId: string) => Promise<number>;
}
