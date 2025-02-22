import { dummyDataUsers, User } from '../types/User';
import { customAlert } from '../helpers';

export const login = async (
  email: string,
  password: string
): Promise<User | null> => {
  const foundUser = dummyDataUsers.find((user) => user.email === email);

  if (!foundUser) {
    customAlert('Greška', 'Pogrešni kredencijali');
    return null;
  }
  if (foundUser.password !== password) {
    customAlert('Greška', 'Pogrešni kredencijali');
    return null;
  }
  if (!foundUser.verified) {
    customAlert(
      'Upozorenje',
      'Vaš nalog još uvek nije verifikovan, sačekajte poruku od korisničke podrške.'
    );
    return null;
  }

  return foundUser;
};

export const register = async (email: string, password: string) => {
  const foundUser = dummyDataUsers.find((user) => user.email === email);

  if (foundUser) {
    return customAlert(
      'Upozorenje',
      'Korisnik sa ovom email adresom već postoji!'
    );
  }

  return customAlert(
    'Obaveštenje',
    'Registracija uspešno izvršena. Sačekate verifikaciju naloga.'
  );
};
