import * as express from 'express';
import {AppConfig} from '../config/config';
import {LocalRooms} from '../service/local/LocalRooms';
import {registerBookitRest} from './server';

registerBookitRest(express(), new LocalRooms(AppConfig.roomLists))
  .listen(AppConfig.port, () => {
    console.log('Ready');
  });
