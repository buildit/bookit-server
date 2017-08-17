import * as express from 'express';
import {RootLog as logger} from '../utils/RootLogger';

import {Runtime} from '../config/runtime/configuration';
import {configureRoutes} from './server';

/* tslint:disable no-require-imports */
const verifyNodeVersion = require('verify-node-version');
/* tslint:enable no-require-imports */

verifyNodeVersion();

const app = express();

logger.info('Server: starting up');
const promisedRoutes = configureRoutes(app,
                                       Runtime.passwordStore,
                                       Runtime.jwtTokenProvider,
                                       Runtime.roomService,
                                       Runtime.userService,
                                       Runtime.mailService,
                                       Runtime.meetingService);

promisedRoutes.listen(Runtime.port, () => {
  logger.info('Server: ready');
});
