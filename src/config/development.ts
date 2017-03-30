import {ConfigRoot} from '../model/ConfigRoot';
import {Room} from '../model/Room';

function r(c: string): Room {
  const email = `nyc-${c}-tv@designit.com`;
  return {name: c, email};
}

const colors = [
  'Red',
  'Green',
  'Blue',
  'White',
  'Black',
  'Yellow',
  'Orange',
  'Cyan',
  'Magenta'
];

const devConf: ConfigRoot = {
  graphApi: {
    clientId: '3140930b-1a27-4e28-8139-d350e3c30843',
    clientSecret: 'dev key',
    tokenEndpoint: 'https://login.windows.net/92261769-1013-420f-8d22-32da90a97f5b/oauth2/token',
  },
  roomLists: [
    {
      name: 'nyc',
      rooms: colors.map(color => r(color))
    }
  ]
};

module.exports = devConf;
