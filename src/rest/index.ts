import * as express from 'express';
import * as cors from 'cors';
import {RootLog as logger} from '../utils/RootLogger';

import {Runtime} from '../config/runtime/configuration';
import {configureRoutes} from './server';

const app = express();
app.use(cors());

logger.info('Server: starting up');
const promisedRoutes = configureRoutes(app,
                                       Runtime.passwordStore,
                                       Runtime.jwtTokenProvider,
                                       Runtime.roomService,
                                       Runtime.userService,
                                       Runtime.meetingService);

promisedRoutes.listen(Runtime.port, () => {
  logger.info('Server: ready');
});
