import * as chai from 'chai';
import * as chai_as_promised from 'chai-as-promised';

chai.use(chai_as_promised);
chai.should();

import {retryUntil} from '../../src/utils/retry';


describe('Sample usage of our test utility `retryUntil`', () => {

  it('should retry until promise resolves to three', () => {
    let counter = 0;

    /*
    Demonstrate that a promised value may fail to resolve and the 'valid' value
    may take a while to resolve.
     */
    function flakyIncrementer() {
      return new Promise((resolve, reject) => {
        const num = Math.random();

        if (num > 0.6) {
          counter++;
          resolve(counter);
        } else {
          reject('fail');
        }
      });
    }

    function isThree(value: any) {
      return value === 3;
    }

    return retryUntil(flakyIncrementer, isThree).should.eventually.equal(3);
  });

});
