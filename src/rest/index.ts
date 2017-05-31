import * as express from 'express';
import * as cors from 'cors';

import {Runtime} from '../config/runtime/configuration';
import {configureRoutes} from './server';

const app = express();
app.use(cors());

console.log('Starting up server');
const promisedRoutes = configureRoutes(app,
                                       Runtime.passwordStore,
                                       Runtime.tokenOperations,
                                       Runtime.roomService,
                                       Runtime.userService,
                                       Runtime.meetingService);

promisedRoutes.listen(Runtime.port, () => {
  console.log('Ready');
});
