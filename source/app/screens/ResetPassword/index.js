import React, {useState} from 'react';
import {View, Platform, Alert} from 'react-native';
import {KeyboardAvoidingView} from 'react-native-keyboard-controller';
import {BaseStyle, useTheme} from '@config';
import {Header, SafeAreaView, Icon, TextInput, Button} from '@components';
import {useTranslation} from 'react-i18next';
import * as api from '@api';

export default function ResetPassword({navigation}) {
  const {colors} = useTheme();
  const {t} = useTranslation();
  const offsetKeyboard = Platform.select({
    ios: 0,
    android: 0,
  });
  const [email, seteEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState({email: true});

  /**
   * call when action reset pass
   */
  const onReset = async () => {
    const value = email.trim();
    if (value == '') {
      setSuccess({
        ...success,
        email: false,
      });
      return;
    }
    setLoading(true);
    try {
      // listar/v1/auth/reset_password answers HTTP 200 even on errors, with
      // {success: true} or {code, message} / {success: false, msg}.
      const response = await api.resetPassword({email: value});
      setLoading(false);
      if (response?.success) {
        Alert.alert({
          type: 'success',
          title: t('reset_password'),
          message: t('reset_password_sent'),
          action: [{onPress: () => navigation.goBack()}],
        });
        return;
      }
      Alert.alert({
        title: t('reset_password'),
        message: response?.message ?? response?.msg ?? t('reset_password_error'),
      });
    } catch (error) {
      setLoading(false);
      Alert.alert({
        title: t('reset_password'),
        message:
          error.response?.data?.message ??
          error.response?.data?.msg ??
          error.message,
      });
    }
  };

  return (
    <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'left']}>
      <Header
        title={t('reset_password')}
        renderLeft={() => {
          return (
            <Icon
              name="times"
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
        <View
          style={{
            flex: 1,
            padding: 20,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <TextInput
            onChangeText={text => seteEmail(text)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            onFocus={() => {
              setSuccess({
                ...success,
                email: true,
              });
            }}
            placeholder={t('email_address')}
            success={success.email}
            value={email}
            selectionColor={colors.primary}
          />
          <Button
            style={{marginTop: 20}}
            full
            onPress={() => {
              onReset();
            }}
            loading={loading}>
            {t('reset_password')}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
