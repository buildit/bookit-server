import {Express, Request, Response, Router} from 'express';

import {RootLog as logger} from '../utils/RootLogger';
import {sendUnauthorized} from './rest_support';
import {Credentials} from '../model/Credentials';
import {JWTTokenProvider} from '../services/tokens/TokenProviders';
import {protectedEndpoint} from './filters';
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
                                              passwordStore: PasswordStore,
                                              jwtTokenProvider: JWTTokenProvider) {

  app.post('/authenticate', (req: Request, res: Response) => {
    const credentials = req.body as Credentials;

    const credentialToken = credentials.code;
    const decoded = jwtTokenProvider.decode(credentialToken);
    if (!passwordStore.validateUser(decoded.unique_name)) {
        sendUnauthorized(res, 'Unrecognized user');
        return;
    }

    const token = jwtTokenProvider.provideToken({
      user: decoded.unique_name,
    });
    logger.info('Successfully authenticated: ', decoded.unique_name);
    res.json({
               token: token,
               email: decoded.unique_name,
               name: decoded.name,
               id: passwordStore.getUserId(decoded.unique_name)
    });
  });


  protectedEndpoint(app, '/backdoor', app.get, (req: Request, res: Response) => {
    const credentials = req.body.credentials as TokenInfo;
    res.send(`You had a token and you are ${credentials.user}`);
  });

}
