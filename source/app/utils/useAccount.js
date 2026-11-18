import {useState} from 'react';
import {Alert} from 'react-native';
import {useDispatch} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {getMessaging, deleteToken} from '@react-native-firebase/messaging';
import {authActions} from '@actions';
import {identifyUser} from '@services/analytics';
import * as api from '@api';

/**
 * Sign-out and account deletion, shared by Profile and ProfileEdit.
 *
 * Account deletion (required by Google Play) deletes the account server-side
 * (wordpress/mu-plugins/sab-account-deletion.php: places are kept and
 * reassigned to an admin), then signs out locally.
 *
 * Note: `Alert.alert` is the app's custom Alert screen (object signature,
 * see screens/Loading).
 */
export default function useAccount(navigation) {
  const dispatch = useDispatch();
  const {t} = useTranslation();
  const [deleting, setDeleting] = useState(false);

  const signOut = () => {
    identifyUser(null);
    dispatch(authActions.onLogout());
    // Best-effort: fails when no FCM token was ever registered (iOS simulator,
    // notifications denied) — must not surface as an unhandled rejection.
    deleteToken(getMessaging()).catch(error =>
      console.warn('FCM deleteToken failed', error?.message),
    );
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await api.deleteAccount();
      // Leave any screen that reads the (soon null) user before signing out,
      // e.g. ProfileEdit, which would crash on `user.image`.
      const state = navigation.getState?.();
      if (state?.type === 'stack' && state.index > 0) {
        navigation.popToTop();
      }
      signOut();
      setDeleting(false);
      Alert.alert({
        type: 'success',
        title: t('delete_account'),
        message: t('delete_account_success'),
      });
    } catch (error) {
      setDeleting(false);
      Alert.alert({
        title: t('delete_account'),
        message:
          error.response?.data?.message ??
          error.response?.data?.code ??
          error.message,
      });
    }
  };

  /** Asks for confirmation, then deletes the account. */
  const onDeleteAccount = () => {
    Alert.alert({
      title: t('delete_account'),
      message: t('delete_account_confirm'),
      action: [
        {text: t('cancel')},
        {
          text: t('delete'),
          // The Alert screen pops itself after this callback; wait for it
          // before navigating / showing the next alert.
          onPress: () => setTimeout(deleteAccount, 350),
        },
      ],
    });
  };

  return {signOut, onDeleteAccount, deleting};
}
