import React, {useState} from 'react';
import {
  View,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import {KeyboardAvoidingView} from 'react-native-keyboard-controller';
import {BaseStyle, useTheme} from '@config';
import {useTranslation} from 'react-i18next';
import {Header, SafeAreaView, Icon, Text, Button, TextInput} from '@components';
import styles from './styles';
import * as api from '@api';

export default function ContactUs({navigation}) {
  const {colors} = useTheme();
  const {t} = useTranslation();
  const offsetKeyboard = Platform.select({
    ios: 0,
    android: 0,
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

  /**
   * @description Called when user sumitted form
   * @author Passion UI <passionui.com>
   * @date 2019-08-03
   */
  const onSubmit = async () => {
    const values = {
      lastname: lastname.trim(),
      firstname: firstname.trim(),
      email: email.trim(),
      message: message.trim(),
    };
    if (Object.values(values).some(v => v == '')) {
      setSuccess({
        ...success,
        lastname: values.lastname != '',
        firstname: values.firstname != '',
        email: values.email != '',
        message: values.message != '',
      });
      return;
    }
    setLoading(true);
    try {
      // Sent by e-mail by the WordPress backend (wordpress/mu-plugins/sab-contact.php).
      await api.sendContactMessage({
        firstname: values.firstname,
        lastname: values.lastname,
        email: values.email,
        content: values.message,
        site: Platform.OS === 'android' ? 'app-android-sab' : 'app-ios-sab',
      });
      setLoading(false);
      Alert.alert({
        type: 'success',
        title: t('contact_us'),
        message: t('contact_send_success'),
        action: [{onPress: () => navigation.goBack()}],
      });
    } catch (error) {
      setLoading(false);
      Alert.alert({
        title: t('contact_us'),
        message:
          error.response?.data?.message ??
          error.response?.data?.code ??
          error.message,
      });
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
        behavior="padding"
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
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
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
