import {expect} from 'chai';
import {getDomain} from '../../src/config/domain';

describe('Domain', () => {
  describe('getDomain()', () => {
    it('returns default when no env passed', () => {
      const _env: any = undefined;
      const result = getDomain(_env);
      expect(result).to.be.an('object');
    });

    it('returns default when null env passed', () => {
      const _env: any = null;
      const result = getDomain(_env);
      expect(result).to.be.an('object');
    });

    it('returns default when nonexistent env passed', () => {
      const _env: any = 'not there';
      const result = getDomain(_env);
      expect(result).to.be.an('object');
    });

    it('returns buildit domain regardless of case', () => {
      const _env: string = 'BuIlDiT';
      const result = getDomain(_env);
      expect(result.domainName).to.equal('builditcontoso.onmicrosoft.com');
      expect(result.sites).to.be.an('array');
      expect(result.sites.length).to.equal(1);
      expect(result.sites[0]).to.equal('nyc');
    });
  });
});
