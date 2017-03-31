import {ConfigRoot} from '../model/ConfigRoot';

const devConf: ConfigRoot = {
  port: 3000,
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
