import React, {useState} from 'react';
import {
  View,
  Platform,
  Alert,
  ActionSheetIOS,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {BaseStyle, BaseColor, useTheme} from '@config';
import {
  Image,
  Header,
  SafeAreaView,
  Icon,
  Text,
  Button,
  TextInput,
} from '@components';
import styles from './styles';
import {userSelect} from '@selectors';
import {useDispatch, useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {authActions} from '@actions';
import useAccount from '@utils/useAccount';

export default function ProfileEdit({navigation}) {
  const {colors} = useTheme();
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector(userSelect) ?? {};
  const {onDeleteAccount, deleting} = useAccount(navigation);

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [website, setWebsite] = useState(user.link);
  const [information, setInformation] = useState(user.description);
  const [loading, setLoading] = useState(false);
  const [avatarUri, setAvatarUri] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [success, setSuccess] = useState({
    name: true,
    email: true,
    website: true,
    information: true,
  });

  /**
   * on Update Profile
   *
   */
  const onUpdate = () => {
    // Only name and email are required; website and information are optional
    // (they are empty on a freshly registered account).
    const cleanName = name?.trim() ?? '';
    const cleanEmail = email?.trim() ?? '';
    if (cleanName == '' || cleanEmail == '') {
      setSuccess({
        ...success,
        name: cleanName != '',
        email: cleanEmail != '',
      });
      Alert.alert({
        title: t('edit_profile'),
        message: t('profile_required_fields'),
      });
      return;
    }
    const params = {
      name: cleanName,
      email: cleanEmail,
      url: website?.trim() ?? '',
      description: information ?? '',
    };
    setLoading(true);
    dispatch(
      authActions.onEditProfile(params, response => {
        setLoading(false);
        // On failure the saga passes the axios error response ({status,
        // data: {code, message}}) or a plain error string instead of the
        // updated user.
        const failed =
          typeof response === 'string' ||
          response?.status >= 400 ||
          response?.data?.code;
        if (failed) {
          Alert.alert({
            title: t('edit_profile'),
            message:
              response?.data?.message ??
              response?.data?.code ??
              String(response),
          });
          return;
        }
        Alert.alert({
          type: 'success',
          title: t('edit_profile'),
          message: t('update_success'),
          action: [{onPress: () => navigation.goBack()}],
        });
      }),
    );
  };

  /**
   * Upload the picked image right away (independently of the form's
   * "confirm" button), with a local preview while it uploads.
   */
  const onPickedImage = result => {
    if (result.didCancel) {
      return;
    }
    const asset = result.assets?.[0];
    if (result.errorCode || !asset?.uri) {
      Alert.alert({
        title: t('edit_profile'),
        message: result.errorMessage ?? result.errorCode,
      });
      return;
    }
    const previousUri = avatarUri;
    setAvatarUri(asset.uri);
    setUploadingAvatar(true);
    dispatch(
      authActions.onUploadAvatar(asset, response => {
        setUploadingAvatar(false);
        if (!response.success) {
          setAvatarUri(previousUri);
          Alert.alert({title: t('edit_profile'), message: response.message});
          return;
        }
        Alert.alert({
          type: 'success',
          title: t('edit_profile'),
          message: t('avatar_update_success'),
        });
      }),
    );
  };

  const pickerOptions = {
    mediaType: 'photo',
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.8,
  };

  // Note: `Alert.alert` is globally overridden in screens/Loading to open the
  // app's own Alert screen (object signature, max two buttons), so the
  // three-option chooser uses the native action sheet on iOS instead.
  const openCamera = () =>
    launchCamera({...pickerOptions, saveToPhotos: false}, onPickedImage);
  const openLibrary = () => launchImageLibrary(pickerOptions, onPickedImage);

  const onChangeAvatar = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: t('change_photo'),
          options: [t('take_photo'), t('choose_from_library'), t('cancel')],
          cancelButtonIndex: 2,
        },
        index => {
          // The picker is presented from the top-most view controller; wait
          // for the action sheet's dismiss animation so UIKit doesn't
          // silently refuse to present on the closing sheet.
          if (index === 0) {
            setTimeout(openCamera, 500);
          } else if (index === 1) {
            setTimeout(openLibrary, 500);
          }
        },
      );
      return;
    }
    // Android: the custom Alert screen; hardware back cancels.
    Alert.alert({
      title: t('change_photo'),
      action: [
        {text: t('take_photo'), onPress: openCamera},
        {text: t('choose_from_library'), onPress: openLibrary},
      ],
    });
  };

  return (
    <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'left']}>
      <Header
        title={t('edit_profile')}
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
      {/* Long form: the scroll view keeps the focused field above the keyboard
          and the footer sticks to the keyboard (no KeyboardAvoidingView around:
          it would compensate the keyboard twice). */}
      <View style={{flex: 1}}>
        <KeyboardAwareScrollView
          // Keep the focused field above the sticky footer (~80px) too.
          bottomOffset={100}
          contentContainerStyle={styles.contain}
          keyboardShouldPersistTaps="handled">
          <TouchableOpacity
            onPress={onChangeAvatar}
            disabled={uploadingAvatar}
            style={styles.thumbContainer}>
            <Image source={{uri: avatarUri ?? user.image}} style={styles.thumb} />
            {uploadingAvatar && (
              <View style={styles.thumbOverlay}>
                <ActivityIndicator color="white" />
              </View>
            )}
            <View
              style={[styles.thumbBadge, {backgroundColor: colors.primary}]}>
              <Icon name="camera" size={14} color="white" solid />
            </View>
          </TouchableOpacity>
          <View style={styles.contentTitle}>
            <Text headline semibold>
              {t('name')}
            </Text>
          </View>
          <TextInput
            onChangeText={text => setName(text)}
            placeholder={t('input_name')}
            value={name}
            success={success.name}
            onFocus={() => {
              setSuccess({
                ...success,
                name: true,
              });
            }}
          />
          <View style={styles.contentTitle}>
            <Text headline semibold>
              {t('email')}
            </Text>
          </View>
          <TextInput
            onChangeText={text => setEmail(text)}
            placeholder={t('input_email')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            success={success.email}
            onFocus={() => {
              setSuccess({
                ...success,
                email: true,
              });
            }}
          />
          <View style={styles.contentTitle}>
            <Text headline semibold>
              {t('website')}
            </Text>
          </View>
          <TextInput
            onChangeText={text => setWebsite(text)}
            placeholder={t('input_website')}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            value={website}
            success={success.website}
            onFocus={() => {
              setSuccess({
                ...success,
                website: true,
              });
            }}
          />
          <View style={styles.contentTitle}>
            <Text headline semibold>
              {t('information')}
            </Text>
          </View>
          <TextInput
            onChangeText={text => setInformation(text)}
            placeholder={t('input_information')}
            value={information}
            success={success.information}
            onFocus={() => {
              setSuccess({
                ...success,
                information: true,
              });
            }}
          />
          <TouchableOpacity
            style={styles.deleteAccount}
            disabled={loading || deleting}
            onPress={onDeleteAccount}>
            {deleting ? (
              <ActivityIndicator color={BaseColor.orangeColor} />
            ) : (
              <Text body1 style={{color: BaseColor.orangeColor}}>
                {t('delete_account')}
              </Text>
            )}
          </TouchableOpacity>
        </KeyboardAwareScrollView>
        <KeyboardStickyView>
          <View
            style={{
              paddingVertical: 15,
              paddingHorizontal: 20,
              backgroundColor: colors.background,
            }}>
            <Button loading={loading} full onPress={onUpdate}>
              {t('confirm')}
            </Button>
          </View>
        </KeyboardStickyView>
      </View>
    </SafeAreaView>
  );
}
