import React, {useState} from 'react';
import {
  View,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import {KeyboardAvoidingView} from 'react-native-keyboard-controller';
import {useDispatch} from 'react-redux';
import {BaseStyle, useTheme} from '@config';
import {Header, SafeAreaView, Icon, Text, Button, TextInput} from '@components';
import styles from './styles';
import {useTranslation} from 'react-i18next';
import {authActions} from '@actions';
import {trackLogin} from '@services/analytics';

export default function SignIn({navigation, route}) {
  const {colors} = useTheme();
  const {t} = useTranslation();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [id, setId] = useState();
  const [password, setPassword] = useState();
  const [success, setSuccess] = useState({id: true, password: true});

  /**
   * call when action onLogin
   */
  const onLogin = () => {
    // Fields start as `undefined`, so test for "empty" rather than == ''.
    if (!id?.trim() || !password) {
      setSuccess({
        ...success,
        id: !!id?.trim(),
        password: !!password,
      });
      return;
    }
    const params = {
      username: id?.trim(),
      password,
    };
    setLoading(true);
    dispatch(
      authActions.onLogin(params, response => {
        if (response?.success) {
          trackLogin(route.params?.source);
          navigation.goBack();
          setTimeout(() => {
            route.params?.success?.();
          }, 1000);
          return;
        }
        // Kadence Security forces a password change on weak or leaked
        // passwords: instead of JSON, the token endpoint then returns its
        // "change your password" wp-login.php page (HTTP 200, HTML).
        if (typeof response === 'string' && /<html|<!doctype/i.test(response)) {
          Alert.alert({
            title: t('sign_in'),
            message: t('password_change_required'),
            action: [
              {text: t('cancel')},
              {
                text: t('reset_password'),
                // The Alert screen pops itself after this callback.
                onPress: () =>
                  setTimeout(() => navigation.navigate('ResetPassword'), 350),
              },
            ],
          });
          setLoading(false);
          return;
        }
        Alert.alert({
          title: t('sign_in'),
          // WordPress error messages contain HTML (e.g. "<strong>Erreur :</strong>").
          message: String(
            response?.data?.message ?? response?.data?.code ?? response,
          )
            .replace(/<[^>]+>/g, '')
            .trim(),
        });
        setLoading(false);
      }),
    );
  };

  const offsetKeyboard = Platform.select({
    ios: 0,
    android: 0,
  });

  return (
    <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'left']}>
      <Header
        title={t('sign_in')}
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
            onChangeText={setId}
            onFocus={() => {
              setSuccess({
                ...success,
                id: true,
              });
            }}
            placeholder={t('input_id')}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="username"
            success={success.id}
            value={id}
          />
          <TextInput
            style={{marginTop: 10}}
            onChangeText={setPassword}
            onFocus={() => {
              setSuccess({
                ...success,
                password: true,
              });
            }}
            placeholder={t('input_password')}
            secureTextEntry={true}
            success={success.password}
            value={password}
          />
          <Button
            style={{marginTop: 20}}
            full
            loading={loading}
            onPress={onLogin}>
            {t('sign_in')}
          </Button>
          <TouchableOpacity
            style={{marginTop: 20}}
            onPress={() => navigation.navigate('ResetPassword')}>
            <Text body1 grayColor>
              {t('forgot_password')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{marginTop: 20}}
            onPress={() =>
              navigation.navigate('SignUp', {source: route.params?.source})
            }>
            <Text body1 grayColor>
              {t('not_have_account')}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
