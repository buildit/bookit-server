import {Express} from 'express';

import {UserService} from '../services/users/UserService';
import {MailService} from '../services/mail/MailService';
import {RootLog as logger} from '../utils/RootLogger';

export function configureUsersRoutes(app: Express,
                                     userSvc: UserService,
                                     mailSvc: MailService): Express {

  app.get('/users', (req, res) => {
    const users = userSvc.getUsers();
    res.json(users);
  });

  app.post('/users', (req, res) => {
    const newUser = {
      email: req.body.email,
      team: req.body.team,
      role: 'user',
    };

    userSvc.postUser(newUser)
      .then(user => {
        logger.info('Created a new user:', user);
        res.json(user);
      })
      .catch(err => {
        logger.error(err);
        res.status(500).send('Failed to create new user.');
      });

    // const senderEmail = 'roodmin@builditcontoso.onmicrosoft.com';
    // mailSvc.sendMail(senderEmail, mockUser.email, 'wipro_user_invitation')
    //   .then(() => {
    //     res.json(mockUser);
    //   })
    //   .catch(err => {
    //     console.error(err.message);
    //     res.send('failed to send mail');
    //   });

  });

  return app;
}
