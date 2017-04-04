import * as assert from 'assert';
import {ConfigRoot} from '../model/ConfigRoot';
import AppEnv from './env';

const clientSecret = AppEnv.MICROSOFT_CLIENT_SECRET;

assert(clientSecret, 'Please set MICROSOFT_CLIENT_SECRET in your env');

const conf: ConfigRoot = {
  useCloud: false,
  port: 8888,
  roomLists: [],
  graphApi: {
    clientId: '3140930b-1a27-4e28-8139-d350e3c30843',
    clientSecret: clientSecret,
    tokenEndpoint: 'https://login.windows.net/92261769-1013-420f-8d22-32da90a97f5b/oauth2/token',
  }
};

module.exports = conf;
