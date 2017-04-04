import {ConfigRoot} from '../model/ConfigRoot';
import {Room} from '../model/Room';
import AppEnv from './env';

function r(c: string): Room {
  const email = `${c.toLowerCase()}-room@myews.onmicrosoft.com`;
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
  useCloud: AppEnv.USE_CLOUD!!,
  roomLists: [
    {
      name: 'nyc',
      rooms: colors.map(color => r(color)) //[{name: 'roman', email: 'romans@myews.onmicrosoft.com'}]
    }
  ]
};

module.exports = devConf;
