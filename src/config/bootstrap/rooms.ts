import {Room, RoomList} from '../../model/Room';
import {MSGroup} from '../../services/groups/GroupService';
import {MSUser} from '../../services/users/UserService';


function produceEWSSuffix() {
  return 'room@myews.onmicrosoft.com';
}


function makeEWSRoom(name: string) {
  return makeRoom(name);
}


let counter = 1;


function makeRoom(color: string, suffixProducer: () => string = produceEWSSuffix): Room {
  const mail = `${color.toLowerCase()}-${suffixProducer()}`;
  return {id: '' + counter++, name: color, mail, email: mail};
}


const roomColors = [
  'Red',
  'Green',
  'White',
  'Black',
  'Yellow',
  'Orange',
  'Cyan',
  'Magenta'
];


export function getEmail(name: string, domain: string) {
  return `${name.toLowerCase()}@${domain}.onmicrosoft.com`;
}


export function getRoomEmail(name: string, domain: string) {
  return `${name.toLowerCase()}-room@${domain}.onmicrosoft.com`;
}


export function generateMSGroup(name: string, domain: string): MSGroup {
  return {
      id: 'room group' + counter++,
      description: 'auto-generated room',
      displayName: `${name}-rooms`,
      mail: getRoomEmail(name, domain)
  };
}


export function generateRomanNYCRoomList(domain: string, roomNames: string[] = roomColors) {
  return roomNames.map(room => generateMSResource(room, domain));
}


export function generateMSResource(name: string, domain: string): MSUser {
  return {
    id: 'room' + counter++,
    description: 'auto-generated room resource',
    displayName: name,
    mail: getRoomEmail(name, domain)
  };
}


export function generateRoomLists(roomNames: string[] = roomColors,
                                  producer: (name: string) => Room = makeEWSRoom): RoomList[] {
  const rooms = roomNames.map(producer);

  return [
    {
      id: '1',
      name: 'nyc',
      rooms
    }
  ];
}


export function generateUnitRoomLists(): RoomList[] {
  return [
    {
      id: '1',
      name: 'nyc',
      rooms: [
        {id: '1', name: 'red', mail: 'red-room@myews.onmicrosoft.com', email: ''},
        {id: '2', name: 'black', mail: 'black-room@myews.onmicrosoft.com', email: ''},
      ]
    }
  ];
}


export function generateIntegrationRoomLists(): RoomList[] {
  return [
    {
      id: '1',
      name: 'nyc',
      rooms: [
        {id: '1', name: 'red', mail: 'red-room@myews.onmicrosoft.com', email: ''},
        {id: '2', name: 'black', mail: 'black-room@myews.onmicrosoft.com', email: ''},
      ]
    }
  ];
}
