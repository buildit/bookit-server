import {Express, Request, Response, Router} from 'express';

import {RootLog as logger} from '../utils/RootLogger';
import {sendUnauthorized} from './rest_support';
import {Credentials} from '../model/Credentials';
import {GraphTokenProvider, JWTTokenProvider} from '../services/tokens/TokenProviders';
import {protectedEndpoint} from './filters';
import {UserService} from '../services/users/UserService';
import {PasswordStore} from '../services/authorization/PasswordStore';



export interface TokenInfo {
  user: string;
  password: string;
  iat: number;
  exp: number;
}


export interface UserDetail {
  token: string;
  email: string;
  name: string;
  id: number;
}


export function configureAuthenticationRoutes(app: Express,
                                              userService: UserService,
                                              jwtTokenProvider: JWTTokenProvider,
                                              graphTokenProvider: GraphTokenProvider) {

  app.post('/authenticate', async (req: Request, res: Response) => {
    const credentials = req.body as Credentials;

    const credentialToken = credentials.code;
    let decoded: any;
    try {
      decoded = await jwtTokenProvider.verifyOpenId(credentialToken);
    }
    catch (error) {
      logger.error('Unable to validate open id');
      sendUnauthorized(res, 'Unrecognized user');
    }

    logger.info('Decoded token', decoded);
    logger.info('Credentials', credentials);
    const rawUserName = decoded.preferred_username || decoded.upn;
    const userName = rawUserName.toLowerCase();
    const userId = decoded.tid;

    const isValidated = await userService.validateUser(userName);
    if (!isValidated) {
      logger.error(`Error validating user ${userName}`);
      sendUnauthorized(res, 'Unrecognized user');
      return;
    }

    if (!userService.isInternalUser(userName)) {
      graphTokenProvider.assignUserToken(userName, credentialToken);
    }

    userService.getUserDetails(userName)
               .then(userDetails => {
                 logger.info('Found user info', userDetails);
                 return userDetails;
               })
               .then((userDetails) => {
                 const userEmail = userDetails.email;
                 const token = jwtTokenProvider.provideToken({user: userEmail});
                 graphTokenProvider.assignUserToken(userEmail, credentialToken);

                 const response = {
                   token: token,
                   email: userEmail,
                   name: decoded.name,
                 };

                 logger.debug('Successfully authenticated: ', response);

                 res.json(response);
               });

  });


  protectedEndpoint(app, '/backdoor', app.get, (req: Request, res: Response) => {
    const credentials = req.body.credentials as TokenInfo;
    res.send(`You had a token and you are ${credentials.user}`);
  });

}
