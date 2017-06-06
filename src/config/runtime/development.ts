import * as moment from 'moment';

import {EnvironmentConfig} from '../../model/EnvironmentConfig';
import {generateMeetings} from '../../utils/data/EventGenerator';

import {MSGraphTokenProvider} from '../../services/tokens/MSGraphTokenProvider';

import {MockUserService} from '../../services/users/MockUserService';

import {CachedMeetingService} from '../../services/meetings/CachedMeetingService';
import {RuntimeConfig} from '../../model/RuntimeConfig';
import {MSGraphMeetingService} from '../../services/meetings/MSGraphMeetingService';
import {generateRoomLists} from '../bootstrap/rooms';
import {MockRoomService} from '../../services/rooms/MockRoomService';
import {MSGraphUserService} from '../../services/users/MSGraphUserService';
import {MockGraphTokenProvider} from '../../services/tokens/MockGraphTokenOperations';
import {MockJWTTokenProvider} from '../../services/tokens/MockJWTTokenProvider';
import {MockPasswordStore} from '../../services/authorization/MockPasswordStore';
import {MSGraphDeviceService} from '../../services/devices/MSGraphDeviceService';
import {MockDeviceService} from '../../services/devices/MockDeviceService';
import {MSGraphGroupService} from '../../services/groups/MSGraphGroupService';
import {MockGroupService} from '../../services/groups/MockGroupService';
import {MSGraphRoomService} from '../../services/rooms/MSGraphRoomService';


export function provideDevelopmentRuntime(env: EnvironmentConfig): RuntimeConfig {
  const jwtTokenProvider = new MockJWTTokenProvider(env.jwtTokenSecret);
  const graphAPIParameters = env.graphAPIParameters;

  if (graphAPIParameters) {
    const tokenOperations = new MSGraphTokenProvider(graphAPIParameters);

    return new RuntimeConfig(env.port,
                             new MockPasswordStore(),
                             tokenOperations,
                             jwtTokenProvider,
                             () => new MSGraphDeviceService(tokenOperations),
                             () => new MSGraphUserService(tokenOperations),
                             () => new MSGraphGroupService(tokenOperations),
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
                                     () => new MockGroupService(),
                                     () => new MockRoomService(generateRoomLists()),
                                     (config) => new CachedMeetingService(config.roomService));

    generateMeetings(config.roomService, config.meetingService, moment().add(-1, 'days'), moment().add(1, 'week'));

    return config;
  }
}
