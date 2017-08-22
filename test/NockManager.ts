import * as nock from 'nock';

export class NockManager {

  setupContactList() {
    nock('https://graph.microsoft.com')
      .get(/v1.0\/users\/.+\/contacts/)
      .reply(200, contactsListMock);
  }

  setupInternalUsersPlusRooms() {
    nock('https://graph.microsoft.com')
      .get('/v1.0/users/')
      .reply(200, internalUsersListWithRoomMock);
  }

  setupInternalUsersWithoutRooms() {
    nock('https://graph.microsoft.com')
      .get('/v1.0/users/')
      .reply(200, internalUsersListMock);
  }

}

const contactsListMock = { 'value': [
    {
      '@odata.etag': <any>'W/EQAAABYAAABKB99Tm01+Q6waLYtxfsHMAAAEgnPn',
      id: <any>'AAMkAGMzMzk0MmRlLWI5Y2EtNGExOS04M2Y1LTQyNDQ4YTFjYmRhYgBGAAAAAABWLwsofOohSqdSMFArzj98BwBKB99Tm01_Q6waLYtxfsHMAAAAAAEOAABKB99Tm01_Q6waLYtxfsHMAAAEgeO2AAA=',
      createdDateTime: <any>'2017-07-31T18:04:13Z',
      lastModifiedDateTime: <any>'2017-07-31T18:04:14Z',
      changeKey: <any>'EQAAABYAAABKB99Tm01+Q6waLYtxfsHMAAAEgnPn',
      categories: <any>[],
      parentFolderId: <any>'AAMkAGMzMzk0MmRlLWI5Y2EtNGExOS04M2Y1LTQyNDQ4YTFjYmRhYgAuAAAAAABWLwsofOohSqdSMFArzj98AQBKB99Tm01_Q6waLYtxfsHMAAAAAAEOAAA=',
      birthday: <any>null,
      fileAs: <any>'Springsteen, Bruce',
      displayName: <any>'Bruce Springsteen',
      givenName: <any>'Bruce',
      initials: <any>null,
      middleName: <any>null,
      nickName: <any>null,
      surname: <any>'Springsteen',
      title: <any>null,
      yomiGivenName: <any>null,
      yomiSurname: <any>null,
      yomiCompanyName: <any>null,
      generation: <any>null,
      imAddresses: <any>[],
      jobTitle: <any>null,
      companyName: <any>null,
      department: <any>null,
      officeLocation: <any>null,
      profession: <any>null,
      businessHomePage: <any>null,
      assistantName: <any>null,
      manager: <any>null,
      homePhones: <any>[],
      mobilePhone: <any>null,
      businessPhones: <any>[],
      spouseName: <any>null,
      personalNotes: <any>'',
      children: <any>[],
      emailAddresses: <any>[{'name': 'bruce@builditcontoso.onmicrosoft.com', 'address': 'bruce@builditcontoso.onmicrosoft.com'}],
      homeAddress: <any>{},
      businessAddress: <any>{},
      otherAddress: <any>{}
    }
  ]
};

const internalUsersListMock = {
  value: [
    { id: <any>'9994edb3-9361-4d6e-a023-5032a2e493af',
       businessPhones: <any>[],
       displayName: <any>'Barbra Striesand',
       givenName: <any>null,
       jobTitle: <any>null,
       mail: <any>null,
       mobilePhone: <any>null,
       officeLocation: <any>null,
       preferredLanguage: <any>null,
       surname: <any>null,
       userPrincipalName: <any>'babs@builditcontoso.onmicrosoft.com' },
  ]
};
const internalUsersListWithRoomMock = {
  value: [
    { id: <any>'9994edb3-9361-4d6e-a023-5032a2e493af',
      businessPhones: <any>[],
      displayName: <any>'Barbra Striesand',
      givenName: <any>null,
      jobTitle: <any>null,
      mail: <any>null,
      mobilePhone: <any>null,
      officeLocation: <any>null,
      preferredLanguage: <any>null,
      surname: <any>null,
      userPrincipalName: <any>'babs@builditcontoso.onmicrosoft.com' },
    { id: <any>'81f00a04-c940-47ec-94cd-40d76fa737ea',
      businessPhones: <any>[],
      displayName: <any>'Red',
      givenName: <any>null,
      jobTitle: <any>null,
      mail: <any>'red-room@builditcontoso.onmicrosoft.com',
      mobilePhone: <any>null,
      officeLocation: <any>'nyc',
      preferredLanguage: <any>null,
      surname: <any>null,
      userPrincipalName: <any>'red-room@builditcontoso.onmicrosoft.com' },
  ]
};
