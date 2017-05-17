import * as express from 'express';
import * as cors from 'cors';

import {Runtime} from '../config/runtime/configuration';
import {configureRoutes} from './server';

const app = express();
app.use(cors());

const promisedRoutes = configureRoutes(app, Runtime.roomService, Runtime.meetingService);

promisedRoutes.listen(Runtime.port, () => {
  console.log('Ready');
});
