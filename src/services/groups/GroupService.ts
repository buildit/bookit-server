
import {MSUser} from '../../model/MSUser';

export interface MSGroup {
  id: string;
  description: string;
  displayName: string;
  mail: string;
}

export interface GroupService {
  getGroup(name: string): Promise<MSGroup>;

  getGroups(): Promise<Array<MSGroup>>;

  getGroupMembers(name: string): Promise<Array<MSUser>>;

  addGroupMember(groupName: string, memberName: string): Promise<boolean>;
}
