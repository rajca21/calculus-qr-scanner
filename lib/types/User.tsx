export interface User {
  uid: string;
  email: string;
  password: string;
  pib: string;
  databases: {
    id: string;
    naziv: string;
  }[];
  verified: boolean;
}

export const dummyDataUsers: User[] = [
  {
    uid: '1',
    email: 'petar@mail.com',
    password: 'password',
    pib: '12345678',
    databases: [
      {
        id: '1',
        naziv: 'Baza 1',
      },
      {
        id: '2',
        naziv: 'Baza 2',
      },
    ],
    verified: true,
  },
  {
    uid: '2',
    email: 'marko@mail.com',
    password: 'password',
    pib: '12345679',
    databases: [
      {
        id: '3',
        naziv: 'Baza 3',
      },
      {
        id: '4',
        naziv: 'Baza 4',
      },
    ],
    verified: true,
  },
];
