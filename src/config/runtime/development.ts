import * as moment from 'moment';

import {EnvironmentConfig} from '../../model/EnvironmentConfig';
import {generateMeetings} from '../../utils/data/EventGenerator';

import {MSGraphTokenProvider} from '../../services/tokens/MSGraphTokenProvider';

import {MockUserService} from '../../services/users/MockUserService';

import {CachedMeetingService} from '../../services/meetings/CachedMeetingService';
import {RuntimeConfig} from '../../model/RuntimeConfig';
import {CloudMeetingService} from '../../services/meetings/CloudMeetingService';
import {generateRoomLists} from '../bootstrap/rooms';
import {MockRoomService} from '../../services/rooms/MockRoomService';
import {CloudUserService} from '../../services/users/CloudUserService';
import {MockGraphTokenProvider} from '../../services/tokens/MockGraphTokenOperations';
import {MockJWTTokenProvider} from '../../services/tokens/MockJWTTokenProvider';
import {MockPasswordStore} from '../../services/authorization/MockPasswordStore';


export function provideDevelopmentRuntime(env: EnvironmentConfig): RuntimeConfig {
  const jwtTokenProvider = new MockJWTTokenProvider(env.jwtTokenSecret);
  const graphAPIParameters = env.graphAPIParameters;

  if (graphAPIParameters) {
    const tokenOperations = new MSGraphTokenProvider(graphAPIParameters);

    return new RuntimeConfig(env.port,
                             new MockPasswordStore(),
                             tokenOperations,
                             jwtTokenProvider,
                             () => new CloudUserService(tokenOperations),
                             () => new MockRoomService(generateRoomLists()),
                             (runtime) => {
                               const cloudMeetingService = new CloudMeetingService(tokenOperations);
                               return new CachedMeetingService(runtime.roomService, cloudMeetingService);
                             });
  } else {

    const config = new RuntimeConfig(env.port,
                                     new MockPasswordStore(),
                                     new MockGraphTokenProvider(),
                                     jwtTokenProvider,
                                     () => new MockUserService(),
                                     () => new MockRoomService(generateRoomLists()),
                                     (config) => new CachedMeetingService(config.roomService));

    generateMeetings(config.roomService, config.meetingService, moment().add(-1, 'days'), moment().add(1, 'week'));

    return config;
  }
}
