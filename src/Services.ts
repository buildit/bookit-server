import {AppConfig} from './config/config';
import {CloudMeetings} from './service/cloud/CloudMeetings';
import {Meetings} from './service/Meetings';
import {StubMeetings} from './service/stub/StubMeetings';
export class Services {
  static createMeetings(): Meetings {
    if (AppConfig.useCloud) {
      return new CloudMeetings(AppConfig.graphApi);
    } else {
      return new StubMeetings();
    }
  }

}
