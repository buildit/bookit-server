import {RootLog as logger} from '../../utils/RootLogger';

import {MailService} from './MailService';

export class MockMailService implements MailService {
  constructor() {
    logger.info('MockMailService: initializing');
  }


  sendMail(senderEmail: string, recipientEmail: string, messageType: string): Promise<any> {
    return new Promise((resolve) => {
      resolve('Yay! Mail sent!');
    });
  }
}
