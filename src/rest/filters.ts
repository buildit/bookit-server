import {Express, Request, Router} from 'express';

import {RootLog as logger} from '../utils/RootLogger';
import {sendUnauthorized} from './rest_support';
import {TokenOperations} from '../services/tokens/TokenOperations';


const tokenFilter = Router();


function once(func: Function, ...args: any[]) {
  return function() {
    const funcRef = func;
    func = null;
    return funcRef.apply(this, args);
  }();
}


export function initializeTokenFilter(tokenOperations: TokenOperations) {
  return once(innerInitializeFilter, tokenOperations);
}


function innerInitializeFilter(tokenOperations: TokenOperations) {
  logger.debug('Initializing token filter');
  tokenFilter.use((req: Request, res, next) => {
    const token = req.body.token || req.query.token || req.headers['x-access-token'];
    if (!token) {
      return res.status(403).send({message: 'Access to this endpoint requires a token'});
    }

    tokenOperations.verify(token)
                   .then(credentials => {
                     req.body.credentials = credentials;
                     next();
                   })
                   .catch(() => {
                     sendUnauthorized(res);
                   });
  });

}

export function protectEndpoint(app: Express, path: string) {
  console.info('JWT protected endpoint:', path);
  app.use(path, tokenFilter);
}
