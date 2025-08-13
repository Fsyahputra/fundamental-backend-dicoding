import type {
  ICollabPresentation,
  TCollab,
  TPostCollabPresentation,
} from '../types/collab.js';
import type { TDataResponse, TMessageResponse } from '../types/shared.js';
import COLLAB from '../constant/collab.js';

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
      message: COLLAB.PRESENTATION_MSG.deleteCollab(collab.id),
    };
  }
}

export default CollabPresentation;
