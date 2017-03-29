import {AppConfig} from '../config';
import * as express from 'express';
import {registerBookitRest} from './server';

registerBookitRest(express())
  .listen(AppConfig.port, () => {
    console.log('Ready');
  });
