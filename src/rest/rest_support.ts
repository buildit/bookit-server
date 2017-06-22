import {Response} from 'express';

import {RootLog as logger} from '../utils/RootLogger';


export function sendStatus(data: any, statusCode: number, res: Response) {
  res.status(statusCode);
  res.json(data);
  res.end();
}

export function sendError(err: any, res: Response) {
  logger.error(err);
  sendStatus({message: err}, 500, res);
}


export function sendGatewayError(err: any, res: Response) {
  logger.error(err);
  sendStatus({message: err}, 502, res);
}


export function sendValidation(err: any, res: Response) {
  logger.error('Responding with error:', err);
  sendStatus({message: err}, 400, res);
}


export function sendNotFound(res: Response, message: string = 'Not found') {
  sendStatus({message}, 404, res);
}


export function sendUnauthorized(res: Response, message: string = 'Unauthorized') {
  sendStatus({message}, 403, res);
}


export function checkParam(cond: boolean, message: string, res: Response): boolean {
  if (!cond) {
    sendValidation(message, res);
    return false;
  }

  return true;
}
