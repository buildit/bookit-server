import {Express, Router} from 'express';
import * as cors from 'cors';
import * as morgan from 'morgan';
import * as bodyParser from 'body-parser';

import {PasswordStore} from '../services/authorization/PasswordStore';

import {MeetingsService} from '../services/meetings/MeetingService';
import {RoomService} from '../services/rooms/RoomService';

import {configureTestRoutes} from './test_routes';
import {configureMeetingRoutes} from './meetings/meeting_routes';
import {configureAuthenticationRoutes} from './auth_routes';
import {initializeCredentialsFilter, initializeTokenFilter} from './filters';
import {configureUsersRoutes} from './user_routes';
import {UserService} from '../services/users/UserService';
import {MailService} from '../services/mail/MailService';
import {JWTTokenProvider} from '../services/tokens/TokenProviders';
import {configureRoomRoutes} from './rooms/room_routes';



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
  initializeCredentialsFilter(jwtTokenProvider);
  configureExpress(app);

  configureAuthenticationRoutes(app, userService, passwordStore, jwtTokenProvider);
  configureTestRoutes(app, mailService);
  configureUsersRoutes(app, userService, mailService);
  configureRoomRoutes(app, roomService);
  configureMeetingRoutes(app, roomService, meetingsService);

  return app;
}
