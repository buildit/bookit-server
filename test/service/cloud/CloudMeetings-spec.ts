import {CloudMeetings} from '../../../src/service/cloud/CloudMeetings';
const svc = new CloudMeetings();

describe('Cloud Meetings service', () => {
  it('returns a list of meetings', () => {
    return svc.getMeetings('f113fd11-c6fa-4991-b05d-0826cd407c37', new Date(), new Date()).then(meetings => {
      console.log(JSON.stringify(meetings));
    });
  });
});
