import * as nodeConfig from 'config';
import * as moment from 'moment';

import {RootLog as logger} from '../../utils/RootLogger';

import {generateIntegrationRoomLists, generateRoomLists, generateUnitRoomLists} from '../bootstrap/rooms';

import {RuntimeConfig} from '../../model/RuntimeConfig';
import {EnvironmentConfig, TestMode} from '../../model/EnvironmentConfig';

import {MockRoomService} from '../../services/rooms/MockRoomService';

import {CloudUserService} from '../../services/users/CloudUserService';
import {CloudMeetingService} from '../../services/meetings/CloudMeetingService';
import {CachedMeetingService} from '../../services/meetings/CachedMeetingService';
import {MockUserService} from '../../services/users/MockUserService';
import {InmemMeetingService} from '../../services/meetings/InmemMeetingService';
import {CloudTokenProvider} from '../../services/tokens/CloudTokenProvider';
// import {MockTokenOperations} from '../../services/stub/MockTokenOperations';
import {StubMeetingService} from '../../services/meetings/StubMeetingService';

import {generateMeetings} from '../../utils/data/EventGenerator';
import {MockPasswordStore} from '../../services/authorization/MockPasswordStore';
import {MockJWTTokenProvider} from '../../services/tokens/MockJWTTokenProvider';

const environment = nodeConfig as EnvironmentConfig;

/*
  request runtime.meetingService
  invoke "get" meetingService (lazy call - invokes factory method #1)
  this will invoke meeting factory method
  but the cached meeting factory will require RoomService
  invoke "get" roomService (lazy call - invokes factory method #2)
  this will invoke room factory method
  constructed cached meeting services will be returned
 */



/*
Start of run-time configuration creation
 */
let config: RuntimeConfig;

logger.debug('environment', environment);

const graphAPIParameters = environment.graphAPIParameters;

const jwtTokens = new MockJWTTokenProvider(environment.jwtTokenSecret);

if (environment.testMode === TestMode.NONE) {


  if (graphAPIParameters) {
    const tokenOperations = new CloudTokenProvider(graphAPIParameters);

    config = new RuntimeConfig(environment.port,
                               new MockPasswordStore(),
                               tokenOperations,
                               jwtTokens,
                               () => new CloudUserService(tokenOperations),
                               () => new MockRoomService(generateRoomLists()),
                               (runtime) => {
                                 const cloudMeetingService = new CloudMeetingService(tokenOperations);
                                 return new CachedMeetingService(cloudMeetingService, runtime.roomService);
                               });
  } else {
    config = new RuntimeConfig(environment.port,
                               new MockPasswordStore(),
                               new CloudTokenProvider(graphAPIParameters),
                               jwtTokens,
                               () => new MockUserService(),
                               () => new MockRoomService(generateRoomLists()),
                               () => new InmemMeetingService());

    generateMeetings(config.roomService, config.meetingService, moment().add(-1, 'days'), moment().add(1, 'week'));
  }

} else if (environment.testMode === TestMode.UNIT) {

  config = new RuntimeConfig(environment.port,
                             new MockPasswordStore(),
                             new CloudTokenProvider(graphAPIParameters),
                             jwtTokens,
                             () => new MockUserService(),
                             () => new MockRoomService(generateUnitRoomLists()),
                             () => new StubMeetingService());

} else if (environment.testMode === TestMode.INTEGRATION) {

  const graphAPIParameters = environment.graphAPIParameters;
  const tokenOperations = new CloudTokenProvider(graphAPIParameters);

  config = new RuntimeConfig(environment.port,
                             new MockPasswordStore(),
                             tokenOperations,
                             jwtTokens,
                             () => new CloudUserService(tokenOperations),
                             () => new MockRoomService(generateIntegrationRoomLists()),
                             () => {
                               return new CloudMeetingService(tokenOperations);
                             });
}


export const Runtime = config;
