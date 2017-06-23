import {RootLog as logger} from '../../utils/RootLogger';

import {MSGraphBase} from '../MSGraphBase';
import {Mail, MailService} from './MailService';
import {GraphTokenProvider} from '../tokens/TokenProviders';

export class MSGraphMailService extends MSGraphBase implements MailService {

  constructor(graphTokenProvider: GraphTokenProvider) {
    super(graphTokenProvider);
    logger.info('Constructing MSGraphMailService');
  }

  sendMail(): Promise<any> {
    logger.info('Calling MS mail service ');

    const mail = {
      subject: 'Microsoft Graph JavaScript Sample',
      toRecipients: [{
        emailAddress: {
          address: 'bruce@designitcontoso.onmicrosoft.com'
        }
      }],
      body: {
        content: `<h1>MicrosoftGraph JavaScript Sample</h1>Check out https://github.com/microsoftgraph/msgraph-sdk-javascript`,
        contentType: 'html'
      }
    };

    return new Promise((resolve, reject) => {
      this.client
        .api('/users/me/sendMail')
        .post({message: mail}, (err, res) => {
          if (err) {
            reject(err);
          }
          resolve(res);
        });
    });
  }

}




