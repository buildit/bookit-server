import {MSUser} from '../../model/MSUser';
import {MSContact} from '../../model/MSContact';
import {BookitUser} from '../../model/BookitUser';

export const mapMSUserToBookitUser = (user: MSUser, team: string): BookitUser=> ({
  email: user.userPrincipalName,
  team,
  roles: ['REGULAR'], // How to get this in the context of a "user"?
  createdDateTime: '',
  firstName: user.givenName,
  lastName: user.surname,
});

export const mapMSContactToBookitUser = (user: MSContact, team: string) => ({
  email: user.emailAddresses[0].address,
  team,
  roles: user.categories,
  createdDateTime: user.createdDateTime,
  firstName: '',
  lastName: '',
});

export const filterOutRooms = (user: MSUser): boolean => !(user.email.search('-room') > -1);
