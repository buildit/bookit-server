
import {MSUser} from '../users/UserService';
export interface MSGroup {
  id: string;
  description: string;
  displayName: string;
  mail: string;
}

export interface GroupService {
  getGroups(): Promise<Array<MSGroup>>;

  getGroupMembers(name: string): Promise<Array<MSUser>>;
}

