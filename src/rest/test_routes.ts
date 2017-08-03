import {Express, Request, Response} from 'express';
import {MailService} from '../services/mail/MailService';


export function configureTestRoutes(app: Express,  mailSvc: MailService) {

  app.get('/', (req: Request, res: Response) => {
    res.send('done');
  });

  app.get('/test', (req: Request, res: Response) => {
    res.send('I have deployed this thang to ECS from Travis, y\'all');
  });

  app.get('/testSendMail', (req: Request, res: Response) => {
    const senderEmail = 'bookit@designitcontoso.onmicrosoft.com';
    const recipientEmail = 'bruce@designitcontoso.onmicrosoft.com';
    const messageType = 'test';

    mailSvc.sendMail(senderEmail, recipientEmail, messageType)
      .then(() => {
        res.send('successfully sent mail');
      })
      .catch(err => {
        console.error(err.message);
        res.send('failed to send mail');
      });
  });
}
