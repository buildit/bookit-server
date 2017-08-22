import {Response} from 'express';

import {RootLog as logger} from '../utils/RootLogger';


export function sendStatus(res: Response, statusCode: number, data: any) {
  res.status(statusCode);
  res.json(data);
  res.end();
}


export function sendError(res: Response, err: any) {
  logger.error(err);
  sendStatus(res, 500, {message: err});
}


export function sendGatewayError(res: Response, err: any) {
  logger.error(err);
  sendStatus(res, 502, {message: err});
}


export function sendValidation(res: Response, err: any) {
  logger.error('Responding with error:', err);
  sendStatus(res, 400, {message: err});
}


export function sendNotFound(res: Response, message: string = 'Not found') {
  sendStatus(res, 404, {message});
}


export function sendUnauthorized(res: Response, message: string = 'Unauthorized') {
  sendStatus(res, 403, {message});
}


export function sendPreconditionFailed(res: Response, message: string = 'Precondition failed') {
  sendStatus(res, 412, {message});
}

export function checkParam(cond: boolean, message: string, res: Response): boolean {
  if (!cond) {
    sendValidation(res, message);
    return false;
  }

  return true;
}
