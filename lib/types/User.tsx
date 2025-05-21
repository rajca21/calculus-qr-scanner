export interface User {
  uid: string;
  email: string;
  companyName: string;
  contact: string;
  databases: {
    serialNum: string;
    name: string;
  }[];
  selectedDB: string | null;
  sessionToken: string;
  verified: boolean;
}
