import {Express, Router} from 'express';
import * as morgan from 'morgan';
import * as bodyParser from 'body-parser';

import {Participant} from '../model/Participant';
import {TokenOperations} from '../service/TokenOperations';
import {PasswordStore} from '../service/PasswordStore';

import {MeetingsService} from '../service/MeetingService';
import {RoomService} from '../service/RoomService';

import {configureTestRoutes} from './test_routes';
import {configureMeetingRoutes} from './meeting_routes';
import {configureAuthenticationRoutes} from './auth_routes';
import {initializeTokenFilter} from './filters';



function configureExpress(app: Express) {
  app.use(bodyParser.json());
  app.use(morgan('dev'));
}


export function configureRoutes(app: Express,
                                passwordStore: PasswordStore,
                                tokenOperations: TokenOperations,
                                roomService: RoomService,
                                meetingsService: MeetingsService): Express {
  initializeTokenFilter(tokenOperations);
  configureExpress(app);

  configureAuthenticationRoutes(app, passwordStore, tokenOperations);
  configureTestRoutes(app);
  configureMeetingRoutes(app, roomService, meetingsService);

  return app;
}
