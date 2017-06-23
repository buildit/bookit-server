import * as log4js from 'log4js';

export const RootLog = log4js.getLogger();

// log4js.configure({
//                    appenders: {
//                      out: { type: 'stdout', layout: {
//                        type: 'pattern',
//                        pattern: '%d %p %c %m%n',
//                      }}
//                    },
//                  });

RootLog.setLevel(log4js.levels.INFO);
