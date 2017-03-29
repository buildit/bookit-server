import {AppConfig} from './config';
import {TokenOperations} from './service/TokenOperations';
import {GraphAPI} from './service/GraphAPI';

new TokenOperations(AppConfig).withToken()
  .then((token) => {
    console.log(`Token is ${token}`);
    return new GraphAPI().getUsers(token);
  })
  .then(users => console.log(users))
  .catch((error) => console.error(error));
