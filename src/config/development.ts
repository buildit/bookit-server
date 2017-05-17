import {EnvironmentConfig, TestMode} from '../model/EnvironmentConfig';


const configuration: EnvironmentConfig = {
  port: 8888,
  testMode: TestMode.NONE
};


/*
 Export unfortunately needs to be done this way since a default export will be named
 and the full configuration will nest this config under it.
 */
module.exports = configuration;
