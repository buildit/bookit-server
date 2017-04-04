import * as express from 'express';
import {AppConfig} from '../config/config';
import {LocalRooms} from '../service/local/LocalRooms';
import {registerBookitRest} from './server';
import * as cors from 'cors';

const app = express();
app.use(cors());

registerBookitRest(app, new LocalRooms(AppConfig.roomLists))
  .listen(AppConfig.port, () => {
    console.log('Ready');
  });
