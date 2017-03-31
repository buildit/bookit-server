import {Room} from './Room';

export interface ConfigRoot {
  port?: number;
  roomLists?: RoomList[];
  graphApi?: ApiSecret;
}

export interface RoomList {
  name: string;
  rooms: Room[];
}

export interface ApiSecret {
  clientId: string;
  clientSecret: string;
  tokenEndpoint: string;
}

export interface Env {
  readonly MICROSOFT_CLIENT_SECRET: string;
}
