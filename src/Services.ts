import {AppConfig} from './config/config';
import {CloudMeetings} from './service/cloud/CloudMeetings';
import {Meetings} from './service/Meetings';
import {InmemMeetings} from './service/stub/InmemMeetings';
import * as moment from 'moment';
import {EventGenerator} from './utils/data/EventGenerator';
export class Services {

  private static createMeetings(): Meetings {
    if (AppConfig.useCloud) {
      return new CloudMeetings(AppConfig.graphApi);
    } else {
      const inmemMeetings = new InmemMeetings();
      EventGenerator(inmemMeetings, moment().add(-1, 'days'), moment().add(1, 'week'));
      return inmemMeetings;
    }
  }

  private static meetingsInst = Services.createMeetings();

  static get meetings(): Meetings {
    return Services.meetingsInst;
  }
}
