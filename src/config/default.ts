import {EnvironmentConfig} from '../model/EnvironmentConfig';
import {setupDefaultEnvironment} from './setup-environment';

const environment: EnvironmentConfig = {};

setupDefaultEnvironment(environment);

module.exports = environment;
