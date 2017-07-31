export type Role = 'ADMIN' | 'REGULAR';

export interface BookitUser {
  email: string;
  team: string;
  roles: Array<Role>;
  createdDateTime: string;
  firstName: string;
  lastName: string;
}
