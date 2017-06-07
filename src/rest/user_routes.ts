import {Express, Request, Response, Router} from 'express';

import {UserService} from '../services/users/UserService';



export function configureUsersRoutes(app: Express,
                                     userSvc: UserService): Express {

  app.get('/users', (req, res) => {
    const users = userSvc.getUsers();
    res.json(users);
  });

  return app;
}