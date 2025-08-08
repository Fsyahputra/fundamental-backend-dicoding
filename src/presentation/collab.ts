import type {
  ICollabPresentation,
  TCollab,
  TPostCollabPresentation,
} from '../types/collab.js';
import type { TDataResponse, TMessageResponse } from '../types/shared.js';

class CollabPresentation implements ICollabPresentation {
  public postCollab(collab: TCollab): TDataResponse<TPostCollabPresentation> {
    return {
      status: 'success',
      data: {
        collaborationId: collab.id,
      },
    };
  }

  public deleteCollab(collab: TCollab): TMessageResponse {
    return {
      status: 'success',
      message: `Collaboration with id ${collab.id} removed successfully`,
    };
  }
}

export default CollabPresentation;
