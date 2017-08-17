
import {GraphTokenProvider} from '../tokens/TokenProviders';
import {Perspective} from '../../model/Meeting';
import {UserService} from '../users/UserService';


export function getToken(tokenOperations: GraphTokenProvider,
                         userService: UserService,
                         perspective: Perspective,
                         user: string): Promise<string> {
  if (perspective === Perspective.ROOM || userService.isInternalUser(user)) {
    return tokenOperations.withToken();
  }

  return tokenOperations.withDelegatedToken(user);
}
