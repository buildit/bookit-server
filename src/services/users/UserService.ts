export interface MSUser {
  id: string;
  description: string;
  displayName: string;
  mail: string;
}

export interface UserService {
  getUsers(): Promise<Array<MSUser>>;

  getDevices(userId: string): Promise<Array<any>>;
}

