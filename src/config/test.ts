import {ConfigRoot} from '../model/ConfigRoot';

const devConf: ConfigRoot = {
  port: 3000,
  graphApi: {
    clientId: '3140930b-1a27-4e28-8139-d350e3c30843',
    clientSecret: '22JmnRwek9O+KyBbk/XicqZw0Z9sqVHpMpjB8U2N2YM=',
    tokenEndpoint: 'https://login.windows.net/92261769-1013-420f-8d22-32da90a97f5b/oauth2/token',
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
