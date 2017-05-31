import {InmemMeetingService} from '../../../src/services/stub/InmemMeetingService';
import StatefulSpec from '../Stateful-spec';

const svc = new InmemMeetingService();

StatefulSpec(svc, 'In-memory meetings services');
