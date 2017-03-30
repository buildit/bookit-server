import {expect} from 'chai';
import {AppConfig} from '../src/config/config';

it('Config is merged from default and dev', () => {
  expect(AppConfig.port).to.equal(3000);
});

it('Development config inherits from default config', () => {
  expect(AppConfig.roomLists).to.not.be.empty;
});
