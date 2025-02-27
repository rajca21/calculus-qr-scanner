export interface User {
  uid: string;
  email: string;
  password: string;
  pib: string;
  companyName: string;
  contact: string;
  databases: {
    id: string;
    serialNum: string;
  }[];
  verified: boolean;
}

export const dummyDataUsers: User[] = [
  {
    uid: '1',
    email: 'petar@mail.com',
    password: 'password',
    pib: '12345678',
    companyName: 'ABC',
    contact: '+381 607122514',
    databases: [
      {
        id: '1',
        serialNum: 'Baza 1',
      },
      {
        id: '2',
        serialNum: 'Baza 2',
      },
    ],
    verified: true,
  },
  {
    uid: '2',
    email: 'marko@mail.com',
    password: 'password',
    pib: '12345679',
    companyName: 'DEF',
    contact: '+381 617122514',
    databases: [
      {
        id: '3',
        serialNum: 'Baza 3',
      },
      {
        id: '4',
        serialNum: 'Baza 4',
      },
    ],
    verified: true,
  },
];
