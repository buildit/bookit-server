import {Room, RoomList} from '../../model/Room';


function produceEWSSuffix() {
  return 'room@myews.onmicrosoft.com';
}


function makeEWSRoom(name: string) {
  return makeRoom(name);
}


function makeRoom(color: string, suffixProducer: () => string = produceEWSSuffix): Room {
  const email = `${color.toLowerCase()}-${suffixProducer()}`;
  return {name: color, email};
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


export function generateRoomLists(roomNames: string[] = roomColors,
                                  producer: (name: string) => Room = makeEWSRoom): RoomList[] {
  const rooms = roomNames.map(producer);

  return [
    {
      name: 'nyc',
      rooms
    }
  ];
}


export function generateIntegrationRoomLists() {
  return [
    {
      name: 'nyc',
      rooms: [
        {name: 'red', email: 'red-room@myews.onmicrosoft.com'},
        {name: 'black', email: 'black-room@myews.onmicrosoft.com'},
      ]
    }
  ];
}
