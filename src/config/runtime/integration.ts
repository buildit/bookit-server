import {EnvironmentConfig} from '../../model/EnvironmentConfig';

import {MSGraphTokenProvider} from '../../services/tokens/MSGraphTokenProvider';

import {RuntimeConfig} from '../../model/RuntimeConfig';
import {generateIntegrationRoomLists} from '../bootstrap/rooms';
import {MockRoomService} from '../../services/rooms/MockRoomService';
import {MockJWTTokenProvider} from '../../services/tokens/MockJWTTokenProvider';
import {MSGraphMeetingService} from '../../services/meetings/MSGraphMeetingService';
import {MSGraphUserService} from '../../services/users/MSGraphUserService';
import {MockPasswordStore} from '../../services/authorization/MockPasswordStore';


export function provideIntegrationRuntime(environment: EnvironmentConfig): RuntimeConfig {
  const jwtTokenProvider = new MockJWTTokenProvider(environment.jwtTokenSecret);
  const graphAPIParameters = environment.graphAPIParameters;
  const tokenOperations = new MSGraphTokenProvider(graphAPIParameters, false);

  return new RuntimeConfig(environment.port,
                           new MockPasswordStore(),
                           tokenOperations,
                           jwtTokenProvider,
                           () => new MSGraphUserService(tokenOperations),
                           () => new MockRoomService(generateIntegrationRoomLists()),
                           () => {
                             return new MSGraphMeetingService(tokenOperations);
                           });
}
