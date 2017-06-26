import {Express, Router} from 'express';
import * as cors from 'cors';
import * as morgan from 'morgan';
import * as bodyParser from 'body-parser';

import {PasswordStore} from '../services/authorization/PasswordStore';

import {MeetingsService} from '../services/meetings/MeetingService';
import {RoomService} from '../services/rooms/RoomService';

import {configureTestRoutes} from './test_routes';
import {configureMeetingRoutes} from './meeting_routes';
import {configureAuthenticationRoutes} from './auth_routes';
import {initializeTokenFilter} from './filters';
import {configureUsersRoutes} from './user_routes';
import {UserService} from '../services/users/UserService';
import {MailService} from '../services/mail/MailService';
import {JWTTokenProvider} from '../services/tokens/TokenProviders';



function configureExpress(app: Express) {
  app.use(bodyParser.json());
  app.use(morgan('dev'));
  app.use(cors());
}


export function configureRoutes(app: Express,
                                passwordStore: PasswordStore,
                                jwtTokenProvider: JWTTokenProvider,
                                roomService: RoomService,
                                userService: UserService,
                                mailService: MailService,
                                meetingsService: MeetingsService): Express {
  initializeTokenFilter(jwtTokenProvider);
  configureExpress(app);

  configureAuthenticationRoutes(app, passwordStore, jwtTokenProvider);
  configureTestRoutes(app, mailService);
  configureUsersRoutes(app, userService);
  configureMeetingRoutes(app, roomService, meetingsService);

  return app;
}
