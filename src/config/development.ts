import {ConfigRoot} from '../model/ConfigRoot';
import {Room} from '../model/Room';
import AppEnv from './env';

function makeRoom(color: string): Room {
  const email = `${color.toLowerCase()}-room@myews.onmicrosoft.com`;
  return {name: color, email};
}

const colors = [
  'Red',
  'Green',
//  'Blue',
  'White',
  'Black',
  'Yellow',
  'Orange',
  'Cyan',
  'Magenta'
];

const devConf: ConfigRoot = {
  useCloud: AppEnv.USE_CLOUD!!,
  roomLists: [
    {
      name: 'nyc',
      rooms: colors.map(makeRoom)
    }
  ]
};

module.exports = devConf;
