import {UserService} from '../services/users/UserService';
import {MailService} from '../services/mail/MailService';
import {RoomService} from '../services/rooms/RoomService';
import {MeetingsService} from '../services/meetings/MeetingService';
import {GraphTokenProvider, JWTTokenProvider} from '../services/tokens/TokenProviders';
import {invokeIfUnset} from '../utils/validation';
import {PasswordStore} from '../services/authorization/PasswordStore';
import {DeviceService} from '../services/devices/DeviceService';
import {GroupService} from '../services/groups/GroupService';
import {Domain} from './EnvironmentConfig';


export type DeviceServiceFactory = (config: RuntimeConfig) => DeviceService;
export type UserServiceFactory = (config: RuntimeConfig) => UserService;
export type MailServiceFactory = (config: RuntimeConfig) => MailService;
export type GroupServiceFactory = (config: RuntimeConfig) => GroupService;
export type MeetingServiceFactory = (config: RuntimeConfig) => MeetingsService;
export type RoomServiceFactory = (config: RuntimeConfig) => RoomService;

/**
 * This class represents the run time configuration that can be used to access services
 */
export class RuntimeConfig {
  private _port: number;
  private _deviceService: DeviceService;
  private _userService: UserService;
  private _mailService: MailService;
  private _groupService: GroupService;
  private _roomService: RoomService;
  private _meetingService: MeetingsService;

  /*
  Things whose creation could be deferred
   */

  constructor(port: number,
              private _passwordStore: PasswordStore,
              private _graphTokenProvider: GraphTokenProvider,
              private _jwtTokenProvider: JWTTokenProvider,
              private _deviceServiceFactory: DeviceServiceFactory,
              private _userServiceFactory: UserServiceFactory,
              private _mailServiceFactory: MailServiceFactory,
              private _groupServiceFactory: GroupServiceFactory,
              private _roomServiceFactory: RoomServiceFactory,
              private _meetingServiceFactory: MeetingServiceFactory) {
    this._port = port;
  }


  get port() {
    return this._port;
  }


  get passwordStore() {
    return this._passwordStore;
  }


  get graphTokenProvider() {
    return this._graphTokenProvider;
  }


  get jwtTokenProvider() {
    return this._jwtTokenProvider;
  }


  get deviceService() {
    this._deviceService = invokeIfUnset(this._deviceService, this._deviceServiceFactory.bind(undefined, this));
    return this._deviceService;
  }


  get userService() {
    this._userService = invokeIfUnset(this._userService, this._userServiceFactory.bind(undefined, this));
    return this._userService;
  }

  get mailService() {
    this._mailService = invokeIfUnset(this._mailService, this._mailServiceFactory.bind(undefined, this));
    return this._mailService;
  }


  get groupService() {
    this._groupService = invokeIfUnset(this._groupService, this._groupServiceFactory.bind(undefined, this));
    return this._groupService;
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
