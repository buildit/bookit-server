import {Express, NextFunction, Request, Router} from 'express';

import {RootLog as logger} from '../utils/RootLogger';
import {sendUnauthorized} from './rest_support';
import {JWTTokenProvider} from '../services/tokens/TokenProviders';
import {Credentials} from 'crypto';


const tokenFilter = Router();
const credentialFilter = Router();

function once(func: Function, ...args: any[]) {
  return function() {
    const funcRef = func;
    func = null;
    return funcRef.apply(this, args);
  }();
}


export function initializeTokenFilter(tokenOperations: JWTTokenProvider) {
  logger.info('initializeTokenFilter');
  return once(innerInitializeTokenFilter, tokenOperations);
}


export function initializeCredentialsFilter(tokenOperations: JWTTokenProvider) {
  logger.info('initializeCredentialsFilter');
  return once(innerCredentialedFilter, tokenOperations);
}


function extractAndVerifyToken(req: Request, tokenOperations: JWTTokenProvider): Promise<Credentials> {
  return new Promise((resolve, reject) => {
    const token = req.body.token || req.query.token || req.headers['x-access-token'];
    logger.info('extractAndVerifyToken -', token);
    if (!token) {
      return reject({message: 'No token string found in request'});
    }

    tokenOperations.verify(token)
                   .then(resolve)
                   .catch(reject);
  });
}


function extractAndSetCredentials(req: Request, tokenOperations: JWTTokenProvider, next: NextFunction) {
  logger.info('extractAndSetCredentials - start');
  return extractAndVerifyToken(req, tokenOperations).then(credentials => {
    req.body.credentials = credentials;
    logger.info('extractAndSetCredentials - got', credentials);
    next();
  }).catch(err => {
    throw new Error(err);
  });
}


function innerInitializeTokenFilter(tokenOperations: JWTTokenProvider) {
  logger.debug('Initializing token filter');
  tokenFilter.use((req: Request, res, next: NextFunction) => {
    return extractAndSetCredentials(req, tokenOperations, next).catch(() => {
      sendUnauthorized(res);
    });
  });
}


function innerCredentialedFilter(tokenOperations: JWTTokenProvider) {
  logger.debug('Initializing credentialed filter');
  credentialFilter.use((req: Request, res, next: NextFunction) => {
    return extractAndSetCredentials(req, tokenOperations, next).catch(() => {
      next();
    });
  });
}


export function credentialedEndpoint(app: Express, route: string, method: Function, handler: (req: any, res: any) => any) {
  logger.info('JWT credentialed endpoint:', route);
  app.use(route, credentialFilter);
  method.apply(app, [route, handler]);
}


export function protectedEndpoint(app: Express, route: string, method: Function, handler: (req: any, res: any) => any) {
  logger.info('JWT protected endpoint:', route);
  app.use(route, tokenFilter);
  method.apply(app, [route, handler]);
}
