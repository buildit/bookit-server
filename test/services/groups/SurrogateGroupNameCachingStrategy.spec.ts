import {expect} from 'chai';

import {SurrogateGroupNameCachingStrategy} from '../../../src/services/groups/SurrogateGroupNameCachingStrategy';
import {MSGroup} from '../../../src/services/groups/GroupService';
import {MSUser} from '../../../src/model/MSUser';


const kewl: MSGroup = {
  id: '1',
  description: 'This is the cool group',
  displayName: 'K007',
  mail: 'rad@awesometacular.com'
};

const andrew = new MSUser('1', 'Andrew', 'Cooler than cool', 'andrew@kewl.com');


describe('surrogate group name caching suite', function surrogateGroupNameCachingSuite() {
  const cache = new Map<string, Map<string, MSUser>>();
  const groupNameCacher = new SurrogateGroupNameCachingStrategy();

  it('caches by name', function testCacheGroupByName() {
    groupNameCacher.put(cache, kewl, andrew);
    const result = groupNameCacher.get(cache, kewl);

    expect(result.length).to.equal(1);
    expect(result[0].name).to.be.equal('Andrew');
  });


  it('evicts by name', function testCacheGroupByName() {
    groupNameCacher.remove(cache, kewl, andrew);
    const result = groupNameCacher.get(cache, kewl);

    expect(result.length).to.equal(0);
  });

});
