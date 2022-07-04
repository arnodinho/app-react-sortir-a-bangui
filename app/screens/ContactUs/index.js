import React, {useState} from 'react';
import {View, KeyboardAvoidingView, Platform, ScrollView} from 'react-native';
import {BaseStyle, useTheme} from '@config';
import {useTranslation} from 'react-i18next';
import {Header, SafeAreaView, Icon, Text, Button, TextInput} from '@components';
import styles from './styles';

export default function ContactUs({navigation}) {
  const {colors} = useTheme();
  const {t} = useTranslation();
  const offsetKeyboard = Platform.select({
    ios: 0,
    android: 20,
  });

  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState({
    firstname: true,
    lastname: true,
    name: true,
    email: true,
    message: true,
  });
  const [loading, setLoading] = useState(false);
  const [region] = useState({
    latitude: 10.73902,
    longitude: 106.704938,
    latitudeDelta: 0.009,
    longitudeDelta: 0.004,
  });

  /**
   * @description Called when user sumitted form
   * @author Passion UI <passionui.com>
   * @date 2019-08-03
   */
  const onSubmit = () => {
    if (lastname == '' || firstname == '' || email == '' || message == '') {
      setSuccess({
        ...success,
        lastname: lastname != '' ? true : false,
        firstname: firstname != '' ? true : false,
        email: email != '' ? true : false,
        message: message != '' ? true : false,
      });
    } else {
      fetch('https://bantu-dico.com/api/message', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstname: firstname,
          lastname: lastname,
          email: email,
          site: Platform.OS === 'android' ? 'app-android-sab' : 'app-ios-sab',
          content: message,
        }),
      }).then(response => response.json());

      setLoading(true);
      setTimeout(() => {
        setLoading(true);
        navigation.goBack();
      }, 500);
    }
  };

  return (
    <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'left']}>
      <Header
        title={t('contact_us')}
        renderLeft={() => {
          return (
            <Icon
              name="arrow-left"
              size={20}
              color={colors.primary}
              enableRTL={true}
            />
          );
        }}
        onPressLeft={() => {
          navigation.goBack();
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'android' ? 'height' : 'padding'}
        keyboardVerticalOffset={offsetKeyboard}
        style={{flex: 1}}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingVertical: 15,
          }}>
          <View style={{height: 100, width: '100%'}}>
            <Text headline style={{marginVertical: 10}}>
              Vous avez des remarques, suggestions à nous faire ? Ecrivez-nous !
            </Text>
          </View>
          <TextInput
            onChangeText={text => setLastname(text)}
            placeholder={t('lastname')}
            success={success.lastname}
            value={lastname}
          />
          <TextInput
            style={{marginTop: 10}}
            onChangeText={text => setFirstname(text)}
            placeholder={t('firstname')}
            success={success.firstname}
            value={firstname}
          />
          <TextInput
            style={{marginTop: 10}}
            onChangeText={text => setEmail(text)}
            placeholderTextColor={'gray'}
            placeholder="Email"
            success={success.email}
            value={email}
          />
          <TextInput
            style={{marginTop: 10, height: 150}}
            onChangeText={text => setMessage(text)}
            textAlignVertical="top"
            multiline={true}
            placeholder={t('message')}
            success={success.message}
            value={message}
          />
        </ScrollView>
        <View style={{paddingVertical: 15, paddingHorizontal: 20}}>
          <Button
            loading={loading}
            full
            onPress={() => {
              onSubmit();
            }}>
            {t('send')}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
