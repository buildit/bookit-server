import {ConfigRoot} from '../model/ConfigRoot';

const devConf: ConfigRoot = {
  useCloud: true,
  port: 3000,
  roomLists: [
    {
      name: 'nyc',
      rooms: [
        {name: 'red', email: 'red-room@myews.onmicrosoft.com'},
        {name: 'black', email: 'black-room@myews.onmicrosoft.com'},
      ]
    }
  ]
};

module.exports = devConf;
