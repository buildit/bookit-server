import * as request from 'superagent';

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
      const url = 'https://graph.microsoft.com/v1.0/users/' + 'roodmin@designitcontoso.onmicrosoft.com' + '/calendar/calendarView';

      this.tokenOperations.withToken()
        .then(token => {
          request.post(url)
            .set('Authorization', `Bearer ${token}`)
            .send(mail)
            .end((error, response) => {
              if (error) {
                console.log('=====');
                console.log(error.message);
                console.log('=====');
                reject(new Error(error));
              }

              resolve(response);
            });
        });
    });
  }

}




