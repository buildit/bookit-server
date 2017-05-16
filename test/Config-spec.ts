import {expect} from 'chai';
import {Runtime} from '../src/config/runtime/configuration';

it('Config is merged from default and dev', () => {
  expect(Runtime.port).to.equal(3000);
});
