import * as dotenv from 'dotenv';
import {Env} from '../model/ConfigRoot';

dotenv.config();
const AppEnv = process.env as Env;
export default AppEnv;
