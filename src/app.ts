import {AppConfig} from './config/config';
import {GraphAPI} from './service/GraphAPI';
import {TokenOperations} from './service/TokenOperations';

new TokenOperations(AppConfig.graphApi).withToken()
  .then((token) => {
    return new GraphAPI().getUsers(token);
  })
  .then(users => console.log(users))
  .catch((error) => console.error(error));
