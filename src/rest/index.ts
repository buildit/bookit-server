import * as express from 'express';
import {AppConfig} from '../config/config';
import {LocalRooms} from '../service/local/LocalRooms';
import {configureRoutes} from './server';
import * as cors from 'cors';

const app = express();
app.use(cors());

configureRoutes(app, new LocalRooms(AppConfig.roomLists))
  .listen(AppConfig.port, () => {
    console.log('Ready');
  });
