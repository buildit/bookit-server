import {Express} from 'express';

import {UserService} from '../services/users/UserService';
import {MailService} from '../services/mail/MailService';
import {RootLog as logger} from '../utils/RootLogger';
import {BookitUser} from '../model/BookitUser';
import {getServiceUser} from '../config/identity';

export function configureUsersRoutes(app: Express,
                                     userSvc: UserService,
                                     mailSvc: MailService): Express {

  app.get('/users', (req, res) => {
    Promise.all([
      userSvc.listInternalUsers(),
      userSvc.listExternalUsers()
    ])
      .then(userLists => {
        const users = userLists[0].concat(userLists[1]);
        res.json(users);
      })
      .catch(err => {
        logger.error(err);
        res.send([]);
      });
  });

  app.post('/users', (req, res) => {
    const newUser = {
      email: req.body.email,
      team: req.body.team,
      role: 'user',
    };

    userSvc.createUser(newUser)
      .then(user => {
        logger.info('Created a new user:', user);

        const senderEmail = getServiceUser('buildit'); // How to get the environment/mode?
        mailSvc.sendMail(senderEmail, user.email, 'wipro_user_invitation')
          .then(() => {
            logger.info('Sent invitation to:', user.email);
            res.json(user);
          })
          .catch(err => {
            logger.error(err.message);
            res.send('Failed to create new user.');
          });
      })
      .catch(err => {
        logger.error(err);
        res.status(500).send('Failed to create new user.');
      });


  });

  return app;
}
