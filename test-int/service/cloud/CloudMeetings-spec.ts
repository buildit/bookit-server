import {AppConfig} from '../../../src/config/config';
import {CloudMeetingService} from '../../../src/service/cloud/CloudMeetingService';
import StatefulSpec from '../../../test/service/Stateful-spec';

const svc = new CloudMeetingService(AppConfig.graphApi);

StatefulSpec(svc, 'Cloud Meetings service');
