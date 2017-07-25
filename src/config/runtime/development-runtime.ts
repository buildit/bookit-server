import * as moment from 'moment';

import {RootLog as logger} from '../../utils/RootLogger';

import {EnvironmentConfig} from '../../model/EnvironmentConfig';
import {generateMeetings} from '../../utils/data/EventGenerator';

import {MSGraphTokenProvider} from '../../services/tokens/MSGraphTokenProvider';

import {MockUserService} from '../../services/users/MockUserService';

import {CachedMeetingService} from '../../services/meetings/CachedMeetingService';
import {RuntimeConfig} from '../../model/RuntimeConfig';
import {MSGraphMeetingService} from '../../services/meetings/MSGraphMeetingService';
import {ROOM_COLORS, generateMSGroup, generateRomanNYCRoomList, generateRoomLists} from '../bootstrap/rooms';
import {MockRoomService} from '../../services/rooms/MockRoomService';
import {MSGraphUserService} from '../../services/users/MSGraphUserService';
import {MSGraphMailService} from '../../services/mail/MSGraphMailService';
import {MockMailService} from '../../services/mail/MockMailService';
import {MockGraphTokenProvider} from '../../services/tokens/MockGraphTokenOperations';
import {MockJWTTokenProvider} from '../../services/tokens/MockJWTTokenProvider';
import {MockPasswordStore} from '../../services/authorization/MockPasswordStore';
import {MSGraphDeviceService} from '../../services/devices/MSGraphDeviceService';
import {MockDeviceService} from '../../services/devices/MockDeviceService';
import {MockGroupService} from '../../services/groups/MockGroupService';
import {MSGraphRoomService} from '../../services/rooms/MSGraphRoomService';
import {MSUser} from '../../services/users/UserService';
import {GroupService} from '../../services/groups/GroupService';
import {MSGraphGroupService} from '../../services/groups/MSGraphGroupService';
import {JWTTokenProvider} from '../../services/tokens/TokenProviders';
import {MockAzureAuthTokenProvider} from '../../services/tokens/MockAzureAuthTokenProvider';


function generateMockGroup(domain: string): GroupService {
  const group = generateMSGroup('nyc', domain);
  const rooms = generateRomanNYCRoomList(domain);

  const map = new Map<string, MSUser[]>();
  map.set(group.id, rooms);

  logger.info('Using MockGroupServer');
  return new MockGroupService([group], map);
}


function provideMockRuntime(env: EnvironmentConfig, jwtTokenProvider: JWTTokenProvider) {
  const config = new RuntimeConfig(env.port,
                                   new MockPasswordStore(),
                                   new MockGraphTokenProvider(),
                                   jwtTokenProvider,
                                   () => new MockDeviceService(),
                                   () => new MockUserService(),
                                   () => new MockMailService(),
                                   () => generateMockGroup(env.domain.domainName),
                                   () => new MockRoomService(generateRoomLists(ROOM_COLORS, env.domain.domainName)),
                                   (config) => new CachedMeetingService(env.domain, config.roomService));

  generateMeetings(config.roomService, config.meetingService, moment().add(-1, 'days'), moment().add(1, 'week'));

  return config;
}


function provideDevelopmentGraphRuntime(env: EnvironmentConfig, jwtTokenProvider: JWTTokenProvider) {
  const tokenOperations = new MSGraphTokenProvider(env.graphAPIParameters, env.domain);

  const createMSGraphGroupService = (runtime: RuntimeConfig): GroupService => new MSGraphGroupService(tokenOperations);
  const createMockGroupService = (runtime: RuntimeConfig) => generateMockGroup(env.domain.domainName);

  const groupServiceFactory = env.graphAPIParameters.identity === 'roman' ? createMockGroupService : createMSGraphGroupService;

  return new RuntimeConfig(env.port,
                           new MockPasswordStore(),
                           tokenOperations,
                           jwtTokenProvider,
                           () => new MSGraphDeviceService(tokenOperations),
                           () => new MSGraphUserService(tokenOperations, env.domain),
                           () => new MSGraphMailService(tokenOperations),
                           groupServiceFactory,
                           (runtime) => new MSGraphRoomService(tokenOperations, runtime.groupService),
                           (runtime) => {
                             const cloudMeetingService = new MSGraphMeetingService(tokenOperations, env.domain);
                             return new CachedMeetingService(env.domain, runtime.roomService, cloudMeetingService);
                           });

}


export function provideDevelopmentRuntime(env: EnvironmentConfig): RuntimeConfig {
  const jwtTokenProvider = new MockJWTTokenProvider(env.jwtTokenSecret, new MockAzureAuthTokenProvider());
  const graphAPIParameters = env.graphAPIParameters;

  if (graphAPIParameters) {
    return provideDevelopmentGraphRuntime(env, jwtTokenProvider);
  } else {
    return provideMockRuntime(env, jwtTokenProvider);
  }
}
