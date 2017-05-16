import {InmemMeetingService} from '../../../src/service/stub/InmemMeetingService';
import StatefulSpec from '../Stateful-spec';

const svc = new InmemMeetingService();

StatefulSpec(svc, 'In-memory meetings service');
