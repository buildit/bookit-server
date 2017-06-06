import {Room, RoomList} from '../../model/Room';


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
