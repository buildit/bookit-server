import {UserService} from '../service/UserService';
import {RoomService} from '../service/RoomService';
import {MeetingsService} from '../service/MeetingService';
import {TokenOperations} from '../service/TokenOperations';
import {invokeIfUnset} from '../utils/validation';


export type UserServiceFactory = (config: RuntimeConfig) => UserService;
export type MeetingServiceFactory = (config: RuntimeConfig) => MeetingsService;
export type RoomServiceFactory = (config: RuntimeConfig) => RoomService;

/**
 * This class represents the run time configuration that can be used to access services
 */
export class RuntimeConfig {
  private _port: number;
  private _userService: UserService;
  private _roomService: RoomService;
  private _meetingService: MeetingsService;

  /*
  Things whose creation could be deferred
   */

  constructor(port: number,
              private _tokenOperations: TokenOperations,
              private _userServiceFactory: UserServiceFactory,
              private _roomServiceFactory: RoomServiceFactory,
              private _meetingServiceFactory: MeetingServiceFactory) {
    this._port = port;
  }


  get port() {
    return this._port;
  }


  get tokenOperations() {
    return this._tokenOperations;
  }


  get userService() {
    this._userService = invokeIfUnset(this._userService, this._userServiceFactory.bind(undefined, this));
    return this._userService;
  }


  get roomService() {
    this._roomService = invokeIfUnset(this._roomService, this._roomServiceFactory.bind(undefined, this));
    return this._roomService;
  }


  get meetingService() {
    this._meetingService = invokeIfUnset(this._meetingService, this._meetingServiceFactory.bind(undefined, this));
    return this._meetingService;
  }
}
