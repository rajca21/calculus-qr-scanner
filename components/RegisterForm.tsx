import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
  Feather,
  MaterialCommunityIcons,
  FontAwesome6,
} from '@expo/vector-icons';

import { customAlert, hasMaliciousInput } from '@/lib/helpers';
import { register } from '@/lib/calculusWS/auhtenticationServices';

export default function RegisterForm({
  setShowRegisterForm,
}: {
  setShowRegisterForm: (value: React.SetStateAction<boolean>) => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pib, setPib] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contact, setContact] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');

    if (
      hasMaliciousInput(email) ||
      hasMaliciousInput(password) ||
      hasMaliciousInput(confirmPassword) ||
      hasMaliciousInput(pib) ||
      hasMaliciousInput(companyName)
    )
      return;
    if (email.trim() === '' || !email) {
      return setError('Unesite E-mail adresu!');
    }
    if (password.trim() === '' || !password) {
      return setError('Unesite lozinku!');
    }
    if (confirmPassword.trim() === '' || !confirmPassword) {
      return setError('Potvrdite lozinku!');
    }
    if (password.trim().length < 8) {
      return setError('Lozinka mora sadržati bar 8 karaktera!');
    }
    if (password.trim() !== confirmPassword.trim()) {
      return setError('Lozinke se ne poklapaju!');
    }
    if (pib.trim() === '' || !pib) {
      return setError('Unesite PIB firme');
    }
    if (companyName.trim() === '' || !companyName) {
      return setError('Unesite naziv firme');
    }

    if (
      hasMaliciousInput(email) ||
      hasMaliciousInput(password) ||
      hasMaliciousInput(confirmPassword) ||
      hasMaliciousInput(pib) ||
      hasMaliciousInput(companyName) ||
      hasMaliciousInput(contact)
    )
      return;

    setLoading(true);

    const res = await register(email, password, pib, companyName, contact);

    setLoading(false);
    if (res === 'success') {
      customAlert(
        'Obaveštenje',
        'Vaš nalog je uspešno kreiran. Bićete kontaktirani od strane korisničke podrške za aktivaciju naloga'
      );
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setCompanyName('');
      setPib('');
      setContact('');
      setShowRegisterForm(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps='handled'
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      extraScrollHeight={84}
      keyboardOpeningTime={0}
    >
      <View className='flex-1 bg-white'>
        <Text className='text-2xl font-rubik-medium text-center mb-4'>
          Kreirajte nalog
        </Text>

        <View className='flex-1'>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* Email */}
            <View
              className={`flex flex-row items-center border border-gray-300 rounded-lg px-4 ${
                Platform.OS === 'ios' ? 'py-4' : 'py-1'
              } mb-4`}
            >
              <Feather name='mail' size={24} color='black' />
              <TextInput
                placeholder='Email adresa *'
                className='pl-4 font-rubik border-none outline-none w-full'
                textContentType='emailAddress'
                value={email}
                onChangeText={(text) => setEmail(text)}
                keyboardType='email-address'
                autoCapitalize='none'
                autoCorrect={false}
              />
            </View>

            {/* Lozinka */}
            <View
              className={`flex flex-row items-center border border-gray-300 rounded-lg px-4 ${
                Platform.OS === 'ios' ? 'py-4' : 'py-1'
              } mb-4`}
            >
              <Feather name='lock' size={24} color='black' />
              <TextInput
                placeholder='Lozinka *'
                secureTextEntry={!showPassword}
                textContentType='oneTimeCode'
                className='px-4 font-rubik border-none outline-none flex-1'
                value={password}
                onChangeText={(text) => setPassword(text)}
              />
              {password.length > 0 && (
                <TouchableOpacity
                  onPress={() => setShowPassword((prev) => !prev)}
                >
                  <Feather
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={22}
                    color='black'
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Potvrda lozinke */}
            <View
              className={`flex flex-row items-center border border-gray-300 rounded-lg px-4 ${
                Platform.OS === 'ios' ? 'py-4' : 'py-1'
              } mb-4`}
            >
              <Feather name='lock' size={24} color='black' />
              <TextInput
                placeholder='Potvrda lozinke *'
                secureTextEntry={!showConfirmPassword}
                textContentType='oneTimeCode'
                className='px-4 font-rubik border-none outline-none flex-1'
                value={confirmPassword}
                onChangeText={(text) => setConfirmPassword(text)}
              />
              {confirmPassword.length > 0 && (
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword((prev) => !prev)}
                >
                  <Feather
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={22}
                    color='black'
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* PIB */}
            <View
              className={`flex flex-row items-center border border-gray-300 rounded-lg px-4 ${
                Platform.OS === 'ios' ? 'py-4' : 'py-1'
              } mb-4`}
            >
              <MaterialCommunityIcons
                name='office-building-outline'
                size={24}
                color='black'
              />
              <TextInput
                placeholder='PIB *'
                textContentType='oneTimeCode'
                className='pl-4 font-rubik border-none outline-none w-full'
                value={pib}
                onChangeText={(text) => setPib(text)}
              />
            </View>

            {/* Naziv firme */}
            <View
              className={`flex flex-row items-center border border-gray-300 rounded-lg px-4 ${
                Platform.OS === 'ios' ? 'py-4' : 'py-1'
              } mb-4`}
            >
              <MaterialCommunityIcons
                name='office-building-outline'
                size={24}
                color='black'
              />
              <TextInput
                placeholder='Naziv firme *'
                textContentType='oneTimeCode'
                className='pl-4 font-rubik border-none outline-none w-full'
                value={companyName}
                onChangeText={(text) => setCompanyName(text)}
              />
            </View>

            {/* Kontakt */}
            <View
              className={`flex flex-row items-center border border-gray-300 rounded-lg px-4 ${
                Platform.OS === 'ios' ? 'py-4' : 'py-1'
              } mb-4`}
            >
              <FontAwesome6 name='contact-book' size={24} color='black' />
              <TextInput
                placeholder='Kontakt telefon/email adresa'
                textContentType='oneTimeCode'
                className='pl-4 font-rubik border-none outline-none w-full'
                value={contact}
                onChangeText={(text) => setContact(text)}
                autoCapitalize='none'
                autoCorrect={false}
              />
            </View>

            {!!error && (
              <Text className='mb-4 text-danger font-rubik-bold text-md'>
                {error}
              </Text>
            )}

            <TouchableOpacity
              disabled={loading}
              onPress={handleRegister}
              className='bg-primary-500 py-3 rounded-lg'
            >
              {loading ? (
                <ActivityIndicator size={'large'} color={'white'} />
              ) : (
                <Text className='text-lg font-rubik-medium text-center text-white'>
                  Registruj se
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}
