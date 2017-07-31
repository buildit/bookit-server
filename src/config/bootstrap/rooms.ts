import {Room, RoomList} from '../../model/Room';
import {MSGroup} from '../../services/groups/GroupService';
import {MSUser} from '../../model/MSUser';

let counter = 1;


export function getEmail(name: string, domain: string) {
  return `${name.toLowerCase()}@${domain}.onmicrosoft.com`;
}


export function getRoomEmail(name: string, domain: string) {
  return getEmail(`${name}-room`, domain);
}


function makeRoom(color: string, domain: string): Room {
  const mail = getRoomEmail(color, domain);
  return {id: '' + counter++, name: color, mail, email: mail};
}


export const ROOM_COLORS = [
  'Red',
  'Green',
  'White',
  'Black',
  'Yellow',
  'Orange',
  'Cyan',
  'Magenta'
];


export function generateMSGroup(name: string, domain: string): MSGroup {
  return {
      id: 'room group' + counter++,
      description: 'auto-generated group',
      displayName: `${name}-rooms`,
      mail: getRoomEmail(name, domain)
  };
}


export function generateRomanNYCRoomList(domain: string, roomNames: string[] = ROOM_COLORS) {
  return roomNames.map(room => generateMSRoomResource(room, domain));
}


export function generateMSUserResource(name: string, domain: string): MSUser {
  return new MSUser('user' + counter++, name, 'auto-generated user resource', getEmail(name, domain));
}


export function generateMSRoomResource(name: string, domain: string): MSUser {
  return new MSUser('room' + counter++, name, 'auto-generated room resource', getRoomEmail(name, domain));
}


export function generateRoomLists(roomNames: string[],
                                  domain: string): RoomList[] {
  const rooms = roomNames.map(name => generateMSRoomResource(name, domain));

  return [
    {
      id: '1',
      name: 'nyc-rooms',
      rooms
    }
  ];
}


export function generateTestRoomLists(domain: string): RoomList[] {
  return [
    {
      id: '1',
      name: 'nyc-rooms',
      rooms: [
        generateMSRoomResource('red', domain),
        generateMSRoomResource('black', domain),
        generateMSRoomResource('white', domain),
      ]
    }
  ];
}
