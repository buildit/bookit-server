import * as chai from 'chai';

import {mapMSUserToBookitUser} from '../../../src/services/users/user_functions';
import {MSUser} from '../../../src/model/MSUser';
import {BookitUser} from '../../../src/model/BookitUser';

const expect = chai.expect;

describe('Utility for mapping from Microsoft\'s representation of a user to Bookit\'s user', function testMapMSUserToBookitUser() {
  const msUser = {
    id: '001',
    description: '',
    name: '',
    displayName: '',
    mail: '',
    email: '',
    userPrincipalName: 'jane@plain.com',
    givenName: 'Jane',
    surname: 'Plain',
  };

  const bookitUser = mapMSUserToBookitUser(msUser, 'HomeTeam');

  it('maps the first name correctly', function testMapFirstName() {
    expect(bookitUser.firstName).to.equal('Jane');
  });

  it('maps the last name correctly', function testMapLastName() {
    expect(bookitUser.lastName).to.equal('Plain');
  });

  it('maps the email correctly', function testMapEmail() {
    expect(bookitUser.email).to.equal('jane@plain.com');
  });

  it('puts the user in the specified team', function testMapTeam() {
    expect(bookitUser.team).to.equal('HomeTeam');
  });

  it('gives the user the role of Regular user', function testMapRole() {
    expect(bookitUser.roles).to.contain('REGULAR');
  });

  it('does not define the user\'s creation time, since this is an internal user', function testMapCreationTime() {
    expect(bookitUser.createdDateTime).to.equal('');
  });
});
