import {Express, Request, Response} from 'express';
import {MailService} from '../services/mail/MailService';


export function configureTestRoutes(app: Express,  mailSvc: MailService) {

  app.get('/', (req: Request, res: Response) => {
    res.send('done');
  });

  app.get('/test', (req: Request, res: Response) => {
    res.send('test succeeded');
  });

  app.get('/testSendMail', (req: Request, res: Response) => {
    mailSvc.sendMail()
      .then(response => {
        console.log(response);
        res.send('successfully sent mail');
      })
      .catch(err => {
        console.error(err);
        res.send('failed to send mail');
      });
  });
}
