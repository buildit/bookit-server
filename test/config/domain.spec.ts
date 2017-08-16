import {expect} from 'chai';
import {getDomain} from '../../src/config/domain';
import {Domain} from '../../src/model/EnvironmentConfig';

describe('Domain', function testDomainSuite() {
  it('returns default when no env passed', function testGetDomainWithoutEnv() {
    const _env: any = undefined;
    const result = getDomain(_env);
    expect(result).to.be.an('object');
  });

  it('returns buildit domain when env is buildit', function testGetEnvTestDomain() {
    const _env: string = 'buildit';
    const result = getDomain(_env);
    expect(result.domainName).to.equal('builditcontoso');
    expect(result.sites).to.be.an('array');
    expect(result.sites.length).to.equal(1);
    expect(result.sites[0]).to.equal('nyc');
  });
});
