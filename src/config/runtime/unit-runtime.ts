import {EnvironmentConfig} from '../../model/EnvironmentConfig';
import {RuntimeConfig} from '../../model/RuntimeConfig';

import {MockUserService} from '../../services/users/MockUserService';

import {generateTestRoomLists} from '../bootstrap/rooms';
import {MockRoomService} from '../../services/rooms/MockRoomService';
import {MockJWTTokenProvider} from '../../services/tokens/MockJWTTokenProvider';
import {MockPasswordStore} from '../../services/authorization/MockPasswordStore';
import {CachedMeetingService} from '../../services/meetings/CachedMeetingService';
import {MockGraphTokenProvider} from '../../services/tokens/MockGraphTokenOperations';
import {MockDeviceService} from '../../services/devices/MockDeviceService';
import {MockGroupService} from '../../services/groups/MockGroupService';
import {MSUser} from '../../services/users/UserService';
import {MSGraphMailService} from '../../services/mail/MSGraphMailService';
import {MSGroup} from '../../services/groups/GroupService';
import {MSGraphTokenProvider} from '../../services/tokens/MSGraphTokenProvider';

export function provideUnitRuntime(environment: EnvironmentConfig): RuntimeConfig {
  const jwtTokenProvider = new MockJWTTokenProvider(environment.jwtTokenSecret);
  const graphAPIParameters = environment.graphAPIParameters;
  const tokenOperations = new MSGraphTokenProvider(graphAPIParameters, environment.domain, false);

  return new RuntimeConfig(environment.port,
                           environment.domain,
                           new MockPasswordStore(),
                           new MockGraphTokenProvider(),
                           jwtTokenProvider,
                           () => new MockDeviceService(),
                           () => new MockUserService(),
                           () => new MSGraphMailService(tokenOperations), // Replace with MockService
                           () => new MockGroupService(new Array<MSGroup>(), new Map<string, MSUser[]>()),
                           () => new MockRoomService(generateTestRoomLists(environment.domain.domainName)),
                           (config) => new CachedMeetingService(environment.domain, config.roomService));
}
