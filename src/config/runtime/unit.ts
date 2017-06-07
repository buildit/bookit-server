import {EnvironmentConfig} from '../../model/EnvironmentConfig';
import {RuntimeConfig} from '../../model/RuntimeConfig';

import {MockUserService} from '../../services/users/MockUserService';

import {generateUnitRoomLists} from '../bootstrap/rooms';
import {MockRoomService} from '../../services/rooms/MockRoomService';
import {MockJWTTokenProvider} from '../../services/tokens/MockJWTTokenProvider';
import {MockPasswordStore} from '../../services/authorization/MockPasswordStore';
import {CachedMeetingService} from '../../services/meetings/CachedMeetingService';
import {MockGraphTokenProvider} from '../../services/tokens/MockGraphTokenOperations';


export function provideUnitRuntime(environment: EnvironmentConfig): RuntimeConfig {
  const jwtTokenProvider = new MockJWTTokenProvider(environment.jwtTokenSecret);

  return new RuntimeConfig(environment.port,
                           new MockPasswordStore(),
                           new MockGraphTokenProvider(),
                           jwtTokenProvider,
                           () => new MockUserService(),
                           () => new MockRoomService(generateUnitRoomLists()),
                           (config) => new CachedMeetingService(config.roomService));
}