import React, {useState} from 'react';
import {View, Platform, Alert} from 'react-native';
import {KeyboardAvoidingView} from 'react-native-keyboard-controller';
import {BaseStyle, useTheme} from '@config';
import {
  Header,
  SafeAreaView,
  Icon,
  Button,
  TextInput,
  PasswordRules,
} from '@components';
import {isPasswordValid} from '@utils/password';
import styles from './styles';
import * as api from '@api';
import {useTranslation} from 'react-i18next';
import {trackSignUp} from '@services/analytics';

export default function SignUp({navigation, route}) {
  const {colors} = useTheme();
  const {t} = useTranslation();
  const offsetKeyboard = Platform.select({
    ios: 0,
    android: 0,
  });
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState({
    username: true,
    email: true,
    password: true,
  });

  /**
   * call when action signup
   *
   */
  const onSignUp = async () => {
    // iOS keyboard suggestions often append a trailing space, which makes the
    // backend reject the email ("Email field is required.").
    const cleanUsername = username.trim();
    const cleanEmail = email.trim();
    if (cleanUsername == '' || cleanEmail == '' || password == '') {
      setSuccess({
        ...success,
        username: cleanUsername != '' ? true : false,
        email: cleanEmail != '' ? true : false,
        password: password != '' ? true : false,
      });
    } else if (!isPasswordValid(password)) {
      setSuccess({...success, password: false});
      Alert.alert({title: t('sign_up'), message: t('password_rule_error')});
    } else {
      setLoading(true);
      try {
        const params = {
          username: cleanUsername,
          password,
          email: cleanEmail,
        };
        await api.signUp(params);
        trackSignUp(route.params?.source);
        Alert.alert({
          type: 'success',
          title: t('sign_up'),
          message: t('register_success'),
          action: [{onPress: () => navigation.goBack()}],
        });
      } catch (error) {
        Alert.alert({
          title: t('sign_up'),
          message:
            error.response?.data?.message ??
            error.response?.data?.code ??
            error.message,
        });
      }
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'left']}>
      <Header
        title={t('sign_up')}
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
        <View style={styles.contain}>
          <TextInput
            onChangeText={text => setUsername(text)}
            placeholder={t('input_id')}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="username"
            success={success.username}
            value={username}
            onFocus={() => {
              setSuccess({
                ...success,
                username: true,
              });
            }}
          />
          <TextInput
            style={{marginTop: 10}}
            onChangeText={text => setEmail(text)}
            placeholder={t('input_email')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
            success={success.email}
            value={email}
            onFocus={() => {
              setSuccess({
                ...success,
                email: true,
              });
            }}
          />
          <TextInput
            style={{marginTop: 10}}
            onChangeText={text => setPassword(text)}
            secureTextEntry={true}
            textContentType="newPassword"
            placeholder={t('input_password')}
            success={success.password}
            value={password}
            onFocus={() => {
              setSuccess({
                ...success,
                password: true,
              });
            }}
          />
          <PasswordRules password={password} />
          <Button
            full
            style={{marginTop: 20}}
            loading={loading}
            onPress={() => onSignUp()}>
            {t('sign_up')}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
