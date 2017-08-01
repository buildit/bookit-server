import {EnvironmentConfig} from '../../model/EnvironmentConfig';
import {RuntimeConfig} from '../../model/RuntimeConfig';

import {MockAzureAuthTokenProvider} from '../../services/tokens/MockAzureAuthTokenProvider';
import {MSGraphUserService} from '../../services/users/MSGraphUserService';

import {generateTestRoomLists} from '../bootstrap/rooms';
import {MockRoomService} from '../../services/rooms/MockRoomService';
import {MockJWTTokenProvider} from '../../services/tokens/MockJWTTokenProvider';
import {MockPasswordStore} from '../../services/authorization/MockPasswordStore';
import {CachedMeetingService} from '../../services/meetings/CachedMeetingService';
import {MockGraphTokenProvider} from '../../services/tokens/MockGraphTokenOperations';
import {MockDeviceService} from '../../services/devices/MockDeviceService';
import {MockGroupService} from '../../services/groups/MockGroupService';
import {MSUser} from '../../services/users/UserService';
import {MockMailService} from '../../services/mail/MockMailService';
import {MSGroup} from '../../services/groups/GroupService';

export function provideUnitRuntime(environment: EnvironmentConfig): RuntimeConfig {
  const jwtTokenProvider = new MockJWTTokenProvider(environment.jwtTokenSecret, new MockAzureAuthTokenProvider());

  return new RuntimeConfig(environment.port,
                           environment.domain,
                           new MockPasswordStore(),
                           new MockGraphTokenProvider(),
                           jwtTokenProvider,
                           () => new MockDeviceService(),
                           () => new MSGraphUserService(new MockGraphTokenProvider()),
                           () => new MockMailService(),
                           () => new MockGroupService(new Array<MSGroup>(), new Map<string, MSUser[]>()),
                           () => new MockRoomService(generateTestRoomLists(environment.domain.domainName)),
                           (config) => new CachedMeetingService(environment.domain, config.roomService));
}
