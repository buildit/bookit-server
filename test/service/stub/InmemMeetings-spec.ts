import {InmemMeetings} from '../../../src/service/stub/InmemMeetings';
import StatefulSpec from '../StatefulSpec';

const svc = new InmemMeetings();

StatefulSpec(svc, 'Inmem Meetings service');
