import * as moment from 'moment';

import {EnvironmentConfig} from '../../model/EnvironmentConfig';
import {generateMeetings} from '../../utils/data/EventGenerator';

import {MSGraphTokenProvider} from '../../services/tokens/MSGraphTokenProvider';

import {MockUserService} from '../../services/users/MockUserService';

import {CachedMeetingService} from '../../services/meetings/CachedMeetingService';
import {RuntimeConfig} from '../../model/RuntimeConfig';
import {MSGraphMeetingService} from '../../services/meetings/MSGraphMeetingService';
import {generateMSGroup, generateRomanNYCRoomList, generateRoomLists} from '../bootstrap/rooms';
import {MockRoomService} from '../../services/rooms/MockRoomService';
import {MSGraphUserService} from '../../services/users/MSGraphUserService';
import {MockGraphTokenProvider} from '../../services/tokens/MockGraphTokenOperations';
import {MockJWTTokenProvider} from '../../services/tokens/MockJWTTokenProvider';
import {MockPasswordStore} from '../../services/authorization/MockPasswordStore';
import {MSGraphDeviceService} from '../../services/devices/MSGraphDeviceService';
import {MockDeviceService} from '../../services/devices/MockDeviceService';
import {MockGroupService} from '../../services/groups/MockGroupService';
import {MSGraphRoomService} from '../../services/rooms/MSGraphRoomService';
import {MSUser} from '../../services/users/UserService';
import {GroupService, MSGroup} from '../../services/groups/GroupService';
import {MSGraphGroupService} from '../../services/groups/MSGraphGroupService';


function generateRomanMockGroup(domain: string) {
  const group = generateMSGroup('nyc', domain);
  const rooms = generateRomanNYCRoomList(domain);

  const map = new Map<string, MSUser[]>();
  map.set(group.id, rooms);

  return new MockGroupService([group], map);
}

export function provideDevelopmentRuntime(env: EnvironmentConfig): RuntimeConfig {
  const jwtTokenProvider = new MockJWTTokenProvider(env.jwtTokenSecret);
  const graphAPIParameters = env.graphAPIParameters;

  if (graphAPIParameters) {
    const tokenOperations = new MSGraphTokenProvider(graphAPIParameters, env.domain);

    const createMSGraphGroupService = (runtime: RuntimeConfig): GroupService => new MSGraphGroupService(tokenOperations);

    const createMockGroupService = (runtime: RuntimeConfig) => {
      return generateRomanMockGroup(env.domain.domainName);
    };

    const groupServiceFactory = graphAPIParameters.identity === 'roman' ? createMockGroupService : createMSGraphGroupService;

    return new RuntimeConfig(env.port,
                             new MockPasswordStore(),
                             tokenOperations,
                             jwtTokenProvider,
                             () => new MSGraphDeviceService(tokenOperations),
                             () => new MSGraphUserService(tokenOperations),
                             groupServiceFactory,
                             (runtime) => new MSGraphRoomService(tokenOperations, runtime.groupService),
                             (runtime) => {
                               const cloudMeetingService = new MSGraphMeetingService(tokenOperations);
                               return new CachedMeetingService(runtime.roomService, cloudMeetingService);
                             });
  } else {

    const config = new RuntimeConfig(env.port,
                                     new MockPasswordStore(),
                                     new MockGraphTokenProvider(),
                                     jwtTokenProvider,
                                     () => new MockDeviceService(),
                                     () => new MockUserService(),
                                     () => new MockGroupService(new Array<MSGroup>(), new Map<string, MSUser[]>()),
                                     () => new MockRoomService(generateRoomLists()),
                                     (config) => new CachedMeetingService(config.roomService));

    generateMeetings(config.roomService, config.meetingService, moment().add(-1, 'days'), moment().add(1, 'week'));

    return config;
  }
}
