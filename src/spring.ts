import {RootLog as logger} from './utils/RootLogger';

import {Runtime} from './config/runtime/configuration';

logger.info('Spring: starting up');

Runtime.userService
       .getUsers()
       .then(users => {
         logger.info('Users', users);
       })
       .catch(error => {
         logger.error(error);
         logger.error('First');
       })
       .then(() => {
         logger.info('Calling again');
         return Runtime.userService.getUsers();
       })
       .catch(error => {
         logger.error(error);
         logger.error('Second');
       });
