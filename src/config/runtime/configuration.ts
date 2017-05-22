import * as nodeConfig from 'config';
import * as moment from 'moment';

import {RootLog as logger} from '../../utils/RootLogger';

import {generateIntegrationRoomLists, generateRoomLists} from '../bootstrap/rooms';

import {RuntimeConfig} from '../../model/RuntimeConfig';
import {EnvironmentConfig, GraphAPIParameters, TestMode} from '../../model/EnvironmentConfig';

import {LocalRooms} from '../../service/local/LocalRooms';

import {CloudUserService} from '../../service/cloud/CloudUserService';
import {CloudMeetingService} from '../../service/cloud/CloudMeetingService';
import {CachedMeetingService} from '../../service/cache/CachedMeetingService';
import {LocalUserService} from '../../service/local/LocalUserService';
import {InmemMeetingService} from '../../service/stub/InmemMeetingService';
import {CloudTokenOperations} from '../../service/cloud/CloudTokenOperations';
// import {StubTokenOperations} from '../../service/stub/StubTokenOperations';
import {StubMeetingService} from '../../service/stub/StubMeetingService';
import {StubUserService} from '../../service/stub/StubUserService';
import {StubRoomService} from '../../service/stub/StubRoomService';

import {generateMeetings} from '../../utils/data/EventGenerator';
import {StubPasswordStore} from '../../service/stub/StubPasswordStore';

const environment = nodeConfig as EnvironmentConfig;

/*
  request runtime.meetingService
  invoke "get" meetingService (lazy call - invokes factory method #1)
  this will invoke meeting factory method
  but the cached meeting factory will require RoomService
  invoke "get" roomService (lazy call - invokes factory method #2)
  this will invoke room factory method
  constructed cached meeting service will be returned
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
