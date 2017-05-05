import {generateMeetings} from './EventGenerator';
import {Services} from '../../Services';

// create random events with meaningful topics
// 2 weeks by default
generateMeetings(Services.meetings)
  .then(() => console.log('Done'))
  .catch(err => console.error('Failed!', err));
