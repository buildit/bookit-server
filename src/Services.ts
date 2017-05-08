import {AppConfig} from './config/config';
import {CloudMeetingService} from './service/cloud/CloudMeetingService';
import {MeetingsService} from './service/MeetingService';
import {InmemMeetings} from './service/stub/InmemMeetings';
import * as moment from 'moment';
import {generateMeetings} from './utils/data/EventGenerator';
import {CachedMeetingService} from './service/cache/CachedMeetingService';

export class Services {

  private static createMeetings(): MeetingsService {
    // TODO: replace this wrapper stuff with ES Proxy
    if (AppConfig.useCloud) {
      const cloudMeetings = new CloudMeetingService(AppConfig.graphApi);
      return new CachedMeetingService(cloudMeetings);
    } else {
      const inmemMeetings = new InmemMeetings();
      generateMeetings(inmemMeetings, moment().add(-1, 'days'), moment().add(1, 'week'));
      return new CachedMeetingService(inmemMeetings);
    }
  }

  private static meetingsInst = Services.createMeetings();

  static get meetings(): MeetingsService {
    return Services.meetingsInst;
  }
}
