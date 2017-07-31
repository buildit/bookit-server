import * as chai from 'chai';

import {mapMSContactToBookitUser} from '../../../src/services/users/user_functions';
import {MSContact} from '../../../src/model/MSContact';
import {BookitUser} from '../../../src/model/BookitUser';

const expect = chai.expect;

describe('Utility for mapping from Microsoft\'s representation of a contact to Bookit\'s user', function testMapMSContactToBookitUser() {
  const msContact = {
    emailAddresses: [{ address: 'jane@plain.com' }],
    createdDateTime: '2017-08-02T19:03:35Z',
    categories: ['REGULAR'],
  };

  const bookitUser = mapMSContactToBookitUser(msContact, 'AwayTeam');

  it('leaves the first name blank', function testMapFirstName() {
    expect(bookitUser.firstName).to.equal('');
  });

  it('leaves the last name blank', function testMapLastName() {
    expect(bookitUser.lastName).to.equal('');
  });

  it('maps the email address correctly', function testMapEmail() {
    expect(bookitUser.email).to.equal('jane@plain.com');
  });

  it('maps the user creation time correctly', function testMapUserCreationTime() {
    expect(bookitUser.createdDateTime).to.equal('2017-08-02T19:03:35Z');
  });

  it('puts the user in the specified team', function testMapTeam() {
    expect(bookitUser.team).to.equal('AwayTeam');
  });

  it('gives the user the role of Regular user', function testMapRole() {
    expect(bookitUser.roles).to.contain('REGULAR');
  });
});
