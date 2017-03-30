import {ConfigRoot} from '../model/ConfigRoot';
require('dotenv').config();

const devConf: ConfigRoot = {
  port: 3000,
  graphApi: {
    clientId: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    tokenEndpoint: process.env.MICROSOFT_CLIENT_TOKEN_,
  },
  roomLists: [
    {
      name: 'nyc',
      rooms: [
        {name: 'red', email: 'red@test.com'},
        {name: 'black', email: 'black@test.com'},
      ]
    }
  ]
};

module.exports = devConf;
