import {Express} from 'express';

import {UserService} from '../services/users/UserService';
import {MailService} from '../services/mail/MailService';

export function configureUsersRoutes(app: Express,
                                     userSvc: UserService,
                                     mailSvc: MailService): Express {

  app.get('/users', (req, res) => {
    const users = userSvc.getUsers();
    res.json(users);
  });

  app.post('/users', (req, res) => {
    const mockUser = {
      id: 777,
      name: 'Barbara Streisand',
      email: req.body.email,
    };

    const senderEmail = 'bookit@designitcontoso.onmicrosoft.com';

    mailSvc.sendMail(senderEmail, mockUser.email, 'wipro_user_invitation')
      .then(() => {
        res.json(mockUser);
      })
      .catch(err => {
        console.error(err.message);
        res.send('failed to send mail');
      });

  });

  return app;
}
