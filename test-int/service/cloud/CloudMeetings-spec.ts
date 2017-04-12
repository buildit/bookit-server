import {AppConfig} from '../../../src/config/config';
import {CloudMeetings} from '../../../src/service/cloud/CloudMeetings';
import StatefulSpec from '../../../test/service/StatefulSpec';

const svc = new CloudMeetings(AppConfig.graphApi);

StatefulSpec(svc, 'Cloud Meetings service');
