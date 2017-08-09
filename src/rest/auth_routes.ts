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
    let decoded;
    try {
      decoded = await jwtTokenProvider.verifyOpenId(credentialToken);
    }
    catch (error) {
      sendUnauthorized(res, 'Unrecognized user');
    }

    const isValidated = await userService.validateUser(decoded.preferred_username.toLowerCase());
    if (!isValidated) {
        sendUnauthorized(res, 'Unrecognized user');
        return;
    }

    graphTokenProvider.assignUserToken(credentials.user, credentialToken);

    const token = jwtTokenProvider.provideToken({
      user: decoded.unique_name,
    });
    logger.info('Successfully authenticated: ', decoded.preferred_username);
    res.json({
               token: token,
               email: decoded.preferred_username,
               name: decoded.name,
    });
  });


  protectedEndpoint(app, '/backdoor', app.get, (req: Request, res: Response) => {
    const credentials = req.body.credentials as TokenInfo;
    res.send(`You had a token and you are ${credentials.user}`);
  });

}
