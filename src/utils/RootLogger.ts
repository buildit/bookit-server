import * as log4js from 'log4js';

export const RootLog = log4js.getLogger();

RootLog.setLevel(log4js.levels.INFO);
