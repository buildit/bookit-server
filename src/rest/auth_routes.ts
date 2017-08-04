import {Express, Request, Response, Router} from 'express';

import {RootLog as logger} from '../utils/RootLogger';
import {sendUnauthorized} from './rest_support';
import {Credentials} from '../model/Credentials';
import {JWTTokenProvider} from '../services/tokens/TokenProviders';
import {protectedEndpoint} from './filters';
import {UserService} from '../services/users/UserService';



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
                                              jwtTokenProvider: JWTTokenProvider) {

  app.post('/authenticate', async (req: Request, res: Response) => {
    const credentials = req.body as Credentials;

    const credentialToken = credentials.code;
    let decoded;
    try {
      decoded = await jwtTokenProvider.verifyOpenId(credentialToken);
    }
    catch (error) {
      console.log('dying because we could not decode the jwt')
      sendUnauthorized(res, 'Unrecognized user');
    }

    const isValidated = await userService.validateUser(decoded.unique_name.toLowerCase());
    if (!isValidated) {
        console.log(`dying because ${decoded.unique_name} is not a valid external user`)
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
    });
  });


  protectedEndpoint(app, '/backdoor', app.get, (req: Request, res: Response) => {
    const credentials = req.body.credentials as TokenInfo;
    res.send(`You had a token and you are ${credentials.user}`);
  });

}
