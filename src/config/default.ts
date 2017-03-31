import {ConfigRoot, Env} from '../model/ConfigRoot';
import * as dotenv from 'dotenv';
import * as assert from 'assert';

dotenv.config();

const env = process.env as Env;
const clientSecret = env.MICROSOFT_CLIENT_SECRET;

assert(clientSecret, 'Please set MICROSOFT_CLIENT_SECRET in your env');

const conf: ConfigRoot = {
  port: 8888,
  roomLists: [],
  graphApi: {
    clientId: '3140930b-1a27-4e28-8139-d350e3c30843',
    clientSecret: clientSecret,
    tokenEndpoint: 'https://login.windows.net/92261769-1013-420f-8d22-32da90a97f5b/oauth2/token',
  }
};

module.exports = conf;
