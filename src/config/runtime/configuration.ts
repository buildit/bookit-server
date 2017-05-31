import * as nodeConfig from 'config';
import * as moment from 'moment';

import {RootLog as logger} from '../../utils/RootLogger';

import {generateIntegrationRoomLists, generateRoomLists} from '../bootstrap/rooms';

import {RuntimeConfig} from '../../model/RuntimeConfig';
import {EnvironmentConfig, GraphAPIParameters, TestMode} from '../../model/EnvironmentConfig';

import {LocalRooms} from '../../services/local/LocalRooms';

import {CloudUserService} from '../../services/cloud/CloudUserService';
import {CloudMeetingService} from '../../services/cloud/CloudMeetingService';
import {CachedMeetingService} from '../../services/cache/CachedMeetingService';
import {LocalUserService} from '../../services/local/LocalUserService';
import {InmemMeetingService} from '../../services/stub/InmemMeetingService';
import {CloudTokenOperations} from '../../services/cloud/CloudTokenOperations';
// import {StubTokenOperations} from '../../services/stub/StubTokenOperations';
import {StubMeetingService} from '../../services/stub/StubMeetingService';
import {StubUserService} from '../../services/stub/StubUserService';
import {StubRoomService} from '../../services/stub/StubRoomService';

import {generateMeetings} from '../../utils/data/EventGenerator';
import {StubPasswordStore} from '../../services/stub/StubPasswordStore';

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

if (environment.testMode === TestMode.NONE) {

  if (graphAPIParameters) {
    const tokenOperations = new CloudTokenOperations(graphAPIParameters, environment.jwtTokenSecret);

    config = new RuntimeConfig(environment.port,
                               new StubPasswordStore(),
                               tokenOperations,
                               () => new CloudUserService(tokenOperations),
                               () => new LocalRooms(generateRoomLists()),
                               (runtime) => {
                                 const cloudMeetingService = new CloudMeetingService(tokenOperations);
                                 return new CachedMeetingService(cloudMeetingService, runtime.roomService);
                               });
  } else {
    config = new RuntimeConfig(environment.port,
                               new StubPasswordStore(),
                               new CloudTokenOperations(graphAPIParameters, environment.jwtTokenSecret),
                               () => new LocalUserService(),
                               () => new LocalRooms(generateRoomLists()),
                               () => new InmemMeetingService());

    generateMeetings(config.roomService, config.meetingService, moment().add(-1, 'days'), moment().add(1, 'week'));
  }

} else if (environment.testMode === TestMode.UNIT) {

  config = new RuntimeConfig(environment.port,
                             new StubPasswordStore(),
                             new CloudTokenOperations(graphAPIParameters, environment.jwtTokenSecret),
                             () => new StubUserService(),
                             () => new StubRoomService(),
                             () => new StubMeetingService());

} else if (environment.testMode === TestMode.INTEGRATION) {

  const graphAPIParameters = environment.graphAPIParameters;
  const tokenOperations = new CloudTokenOperations(graphAPIParameters, environment.jwtTokenSecret);

  config = new RuntimeConfig(environment.port,
                             new StubPasswordStore(),
                             tokenOperations,
                             () => new CloudUserService(tokenOperations),
                             () => new LocalRooms(generateIntegrationRoomLists()),
                             () => {
                               return new CloudMeetingService(tokenOperations);
                             });
}


export const Runtime = config;
