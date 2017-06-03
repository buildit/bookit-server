import {EnvironmentConfig} from '../../model/EnvironmentConfig';

import {MSGraphTokenProvider} from '../../services/tokens/MSGraphTokenProvider';

import {MockUserService} from '../../services/users/MockUserService';

import {RuntimeConfig} from '../../model/RuntimeConfig';
import {generateUnitRoomLists} from '../bootstrap/rooms';
import {MockRoomService} from '../../services/rooms/MockRoomService';
import {MockJWTTokenProvider} from '../../services/tokens/MockJWTTokenProvider';
import {MockPasswordStore} from '../../services/authorization/MockPasswordStore';
import {CachedMeetingService} from '../../services/meetings/CachedMeetingService';


export function provideUnitRuntime(environment: EnvironmentConfig): RuntimeConfig {
  const jwtTokenProvider = new MockJWTTokenProvider(environment.jwtTokenSecret);
  const graphAPIParameters = environment.graphAPIParameters;

  return new RuntimeConfig(environment.port,
                           new MockPasswordStore(),
                           new MSGraphTokenProvider(graphAPIParameters),
                           jwtTokenProvider,
                           () => new MockUserService(),
                           () => new MockRoomService(generateUnitRoomLists()),
                           (config) => new CachedMeetingService(config.roomService));
}
