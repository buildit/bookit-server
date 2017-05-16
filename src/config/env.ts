import * as dotenv from 'dotenv';

import {Env} from '../model/EnvironmentConfig';

/*
This file is bootstrapping the .env file
 */
dotenv.config();
const AppEnv = process.env as Env;
export default AppEnv;
