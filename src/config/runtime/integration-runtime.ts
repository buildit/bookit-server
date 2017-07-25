import {EnvironmentConfig} from '../../model/EnvironmentConfig';

import {MockAzureAuthTokenProvider} from '../../services/tokens/MockAzureAuthTokenProvider';

import {MSGraphTokenProvider} from '../../services/tokens/MSGraphTokenProvider';

import {RuntimeConfig} from '../../model/RuntimeConfig';
import {generateTestRoomLists} from '../bootstrap/rooms';
import {MockRoomService} from '../../services/rooms/MockRoomService';
import {MockJWTTokenProvider} from '../../services/tokens/MockJWTTokenProvider';
import {MSGraphMeetingService} from '../../services/meetings/MSGraphMeetingService';
import {MSGraphUserService} from '../../services/users/MSGraphUserService';
import {MSGraphMailService} from '../../services/mail/MSGraphMailService';
import {MockPasswordStore} from '../../services/authorization/MockPasswordStore';
import {MSGraphDeviceService} from '../../services/devices/MSGraphDeviceService';
import {MSGraphGroupService} from '../../services/groups/MSGraphGroupService';


export function provideIntegrationRuntime(environment: EnvironmentConfig): RuntimeConfig {
  const jwtTokenProvider = new MockJWTTokenProvider(environment.jwtTokenSecret, new MockAzureAuthTokenProvider());
  const graphAPIParameters = environment.graphAPIParameters;
  const tokenOperations = new MSGraphTokenProvider(graphAPIParameters, environment.domain, false);

  return new RuntimeConfig(environment.port,
                           new MockPasswordStore(),
                           tokenOperations,
                           jwtTokenProvider,
                           () => new MSGraphDeviceService(tokenOperations),
                           () => new MSGraphUserService(tokenOperations, environment.domain),
                           () => new MSGraphMailService(tokenOperations),
                           () => new MSGraphGroupService(tokenOperations),
                           () => new MockRoomService(generateTestRoomLists(environment.domain.domainName)),
                           () => {
                             return new MSGraphMeetingService(tokenOperations, environment.domain);
                           });
}
