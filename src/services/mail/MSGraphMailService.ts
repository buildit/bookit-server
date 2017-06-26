import * as request from 'superagent';

import {RootLog as logger} from '../../utils/RootLogger';

import {MSGraphBase} from '../MSGraphBase';
import {MailService} from './MailService';
import {GraphTokenProvider} from '../tokens/TokenProviders';
import {Mail} from '../../model/Mail';
import mailMessages from '../../localization/mailMessages';

export class MSGraphMailService extends MSGraphBase implements MailService {

  constructor(graphTokenProvider: GraphTokenProvider) {
    super(graphTokenProvider);
    logger.info('Constructing MSGraphMailService');
  }

  sendMail(senderEmail: string, recipientEmail: string, messageType: string): Promise<any> {
    logger.info('Calling MS mail service ');

    const mail = createMail(recipientEmail, messageType);

    return new Promise((resolve, reject) => {
      const url = 'https://graph.microsoft.com/v1.0/users/' + senderEmail + '/sendMail';

      this.tokenOperations.withToken()
          .then(token => {
            request.post(url)
                   .set('Authorization', `Bearer ${token}`)
                   .send(mail)
                   .end((error, response) => {
                     if (error) {
                       reject(error);
                     }
                     resolve(response);
                   });
          });
    });
  };

}

// Utils

function createMail(recipientEmail: string, messageType: string): Mail {
  const subject = mailMessages.get(messageType).subject;
  const content = mailMessages.get(messageType).content;

  return {
    message: {
      subject,
      toRecipients: [
        {
          emailAddress: {
            address: recipientEmail,
          }
        },
      ],
      body: {
        content,
        contentType: 'html'
      }
    }
  };
}




