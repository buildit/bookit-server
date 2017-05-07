import {AppConfig} from './config/config';
import {CloudMeetings} from './service/cloud/CloudMeetings';
import {MeetingsService} from './service/MeetingService';
import {InmemMeetings} from './service/stub/InmemMeetings';
import * as moment from 'moment';
import {generateMeetings} from './utils/data/EventGenerator';
import {CachedMeetings} from './service/cache/CachedMeetings';

export class Services {

  private static createMeetings(): MeetingsService {
    // TODO: replace this wrapper stuff with ES Proxy
    if (AppConfig.useCloud) {
      const cloudMeetings = new CloudMeetings(AppConfig.graphApi);
      return new CachedMeetings(cloudMeetings);
    } else {
      const inmemMeetings = new InmemMeetings();
      generateMeetings(inmemMeetings, moment().add(-1, 'days'), moment().add(1, 'week'));
      return new CachedMeetings(inmemMeetings);
    }
  }

  private static meetingsInst = Services.createMeetings();

  static get meetings(): MeetingsService {
    return Services.meetingsInst;
  }
}
