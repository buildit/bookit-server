import {InmemMeetings} from '../../../src/service/stub/InmemMeetings';
import StatefulSpec from '../Stateful-spec';

const svc = new InmemMeetings();

StatefulSpec(svc, 'Inmem Meetings service');
