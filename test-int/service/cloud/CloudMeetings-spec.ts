import {Runtime} from '../../../src/config/runtime/configuration';
import StatefulSpec from '../../../test/services/Stateful-spec';

const svc = Runtime.meetingService;

StatefulSpec(svc, 'Cloud Meetings services');
