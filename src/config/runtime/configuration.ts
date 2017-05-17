import * as nodeConfig from 'config';

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
import {StubTokenOperations} from '../../service/stub/StubTokenOperations';
import {StubMeetingService} from '../../service/stub/StubMeetingService';
import {StubUserService} from '../../service/stub/StubUserService';
import {StubRoomService} from '../../service/stub/StubRoomService';

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

/**
 * This constructs a cloud runtime configuration.
 *
 * @param graphAPIParameters - credentials for connect to microsoft graph
 * @param roomGenerator - the function to invoke to generate the room list
 */
function constructCloudRuntime(graphAPIParameters: GraphAPIParameters, roomGenerator = generateRoomLists) {
  const tokenOperations = new CloudTokenOperations(graphAPIParameters);

  return new RuntimeConfig(environment.port,
                           tokenOperations,
                           () => new CloudUserService(tokenOperations),
                           () => new LocalRooms(roomGenerator()),
                           (runtime) => {
                             const cloudMeetingService = new CloudMeetingService(tokenOperations);
                             return new CachedMeetingService(cloudMeetingService, runtime.roomService);
                           });

}


/*
Start of run-time configuration creation
 */
let config: RuntimeConfig;

logger.debug('environment', environment);

if (environment.testMode === TestMode.NONE) {

  const graphAPIParameters = environment.graphAPIParameters;
  if (graphAPIParameters) {
    const tokenOperations = new CloudTokenOperations(graphAPIParameters);

    config = new RuntimeConfig(environment.port,
                               tokenOperations,
                               () => new CloudUserService(tokenOperations),
                               () => new LocalRooms(generateRoomLists()),
                               (runtime) => {
                                 const cloudMeetingService = new CloudMeetingService(tokenOperations);
                                 return new CachedMeetingService(cloudMeetingService, runtime.roomService);
                               });
  } else {
    config = new RuntimeConfig(environment.port,
                               new StubTokenOperations(),
                               () => new LocalUserService(),
                               () => new LocalRooms(generateRoomLists()),
                               () => new InmemMeetingService());
  }

} else if (environment.testMode === TestMode.UNIT) {

  config = new RuntimeConfig(environment.port,
                             new StubTokenOperations(),
                             () => new StubUserService(),
                             () => new StubRoomService(),
                             () => new StubMeetingService());

} else if (environment.testMode === TestMode.INTEGRATION) {

  const graphAPIParameters = environment.graphAPIParameters;
  const tokenOperations = new CloudTokenOperations(graphAPIParameters);

  config = new RuntimeConfig(environment.port,
                             tokenOperations,
                             () => new CloudUserService(tokenOperations),
                             () => new LocalRooms(generateIntegrationRoomLists()),
                             () => {
                               return new CloudMeetingService(tokenOperations);
                             });
}


export const Runtime = config;
