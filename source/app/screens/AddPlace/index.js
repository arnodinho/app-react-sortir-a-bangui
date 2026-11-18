import React, {useEffect, useState} from 'react';
import {
  View,
  ScrollView,
  Platform,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  ActionSheetIOS,
} from 'react-native';
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';
import {useDispatch} from 'react-redux';
import {useTranslation} from 'react-i18next';
import MapView, {PROVIDER_GOOGLE, Marker} from 'react-native-maps';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {BaseStyle, BaseColor, useTheme} from '@config';
import {
  Header,
  SafeAreaView,
  Icon,
  Text,
  Button,
  TextInput,
  Image,
} from '@components';
import {productActions} from '@actions';
import {trackPlaceSubmitted} from '@services/analytics';
import styles from './styles';

const MAX_PHOTOS = 5;

// The app only covers Bangui: new places are filed under
// République centrafricaine > Ombella-M'Poko > Bangui (listar_location term
// ids on the backend, same as the existing places).
const DEFAULT_LOCATION = {country: 66, state: 57, city: 29};

// Fallback if place/form doesn't return a map center (Bangui).
const BANGUI = {latitude: 4.3619, longitude: 18.5829};

const pickerOptions = {
  mediaType: 'photo',
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.8,
};

export default function AddPlace({navigation}) {
  const {colors} = useTheme();
  const {t} = useTranslation();
  const dispatch = useDispatch();

  const [loadingForm, setLoadingForm] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [mapCenter, setMapCenter] = useState(BANGUI);

  const [images, setImages] = useState([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(null);
  const [content, setContent] = useState('');
  const [address, setAddress] = useState('');
  const [coordinate, setCoordinate] = useState(null);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [success, setSuccess] = useState({
    title: true,
    category: true,
    content: true,
  });

  useEffect(() => {
    dispatch(
      productActions.onLoadPlaceForm(response => {
        setLoadingForm(false);
        if (!response.success) {
          Alert.alert({title: t('add_place'), message: response.message});
          return;
        }
        setCategories(
          (response.data?.categories ?? []).map(item => ({
            id: item.term_id,
            title: item.name,
          })),
        );
        const [latitude, longitude] = response.data?.map_center ?? [];
        if (latitude && longitude) {
          setMapCenter({latitude, longitude});
        }
      }),
    );
  }, [dispatch, t]);

  /* Photos */

  const onPickedImages = result => {
    if (result.didCancel) {
      return;
    }
    if (result.errorCode) {
      Alert.alert({
        title: t('add_place'),
        message: result.errorMessage ?? result.errorCode,
      });
      return;
    }
    const assets = (result.assets ?? []).filter(asset => asset?.uri);
    setImages(current => [...current, ...assets].slice(0, MAX_PHOTOS));
  };

  const openCamera = () =>
    launchCamera({...pickerOptions, saveToPhotos: false}, onPickedImages);
  const openLibrary = () =>
    launchImageLibrary(
      {...pickerOptions, selectionLimit: MAX_PHOTOS - images.length},
      onPickedImages,
    );

  const onAddPhoto = () => {
    // Alert.alert is overridden app-wide (screens/Loading) and shows max two
    // buttons: use the native action sheet on iOS.
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [t('take_photo'), t('choose_from_library'), t('cancel')],
          cancelButtonIndex: 2,
        },
        index => {
          // Let the sheet finish dismissing before presenting the picker.
          if (index === 0) {
            setTimeout(openCamera, 500);
          } else if (index === 1) {
            setTimeout(openLibrary, 500);
          }
        },
      );
      return;
    }
    Alert.alert({
      title: t('photos'),
      action: [
        {text: t('take_photo'), onPress: openCamera},
        {text: t('choose_from_library'), onPress: openLibrary},
      ],
    });
  };

  const onRemovePhoto = uri => {
    setImages(current => current.filter(item => item.uri !== uri));
  };

  /* Category */

  const onSelectCategory = () => {
    navigation.navigate('PickerScreen', {
      title: t('category'),
      data: categories,
      selected: category,
      onApply: value => {
        if (value) {
          setCategory(value);
          setSuccess(current => ({...current, category: true}));
        }
      },
    });
  };

  /* Submit */

  const onSubmit = () => {
    const values = {
      title: title.trim(),
      content: content.trim(),
    };
    const valid = {
      title: values.title !== '',
      category: !!category,
      content: values.content !== '',
    };
    setSuccess(valid);
    if (!valid.title || !valid.category || !valid.content) {
      Alert.alert({
        title: t('add_place'),
        message: t('place_required_fields'),
      });
      return;
    }
    setSubmitting(true);
    dispatch(
      productActions.onCreatePlace(
        {
          ...values,
          category: category.id,
          location: DEFAULT_LOCATION,
          address: address.trim(),
          phone: phone.trim(),
          email: email.trim(),
          website: website.trim(),
          latitude: coordinate?.latitude,
          longitude: coordinate?.longitude,
          images,
        },
        response => {
          setSubmitting(false);
          if (!response.success) {
            Alert.alert({title: t('add_place'), message: response.message});
            return;
          }
          trackPlaceSubmitted(images.length > 0);
          Alert.alert({
            type: 'success',
            title: t('add_place'),
            message: t('place_create_success'),
            action: [{onPress: () => navigation.goBack()}],
          });
        },
      ),
    );
  };

  /* Render */

  const renderLabel = (label, required = false) => (
    <View style={styles.contentTitle}>
      <Text headline semibold>
        {label}
        {required ? ' *' : ''}
      </Text>
    </View>
  );

  const renderPhotos = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.photoList}>
      {images.map(item => (
        <View key={item.uri} style={styles.photoItem}>
          <Image source={{uri: item.uri}} style={styles.photo} />
          <TouchableOpacity
            style={styles.photoRemove}
            onPress={() => onRemovePhoto(item.uri)}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Icon name="times" size={12} color={BaseColor.whiteColor} />
          </TouchableOpacity>
        </View>
      ))}
      {images.length < MAX_PHOTOS && (
        <TouchableOpacity
          style={[
            styles.photoAdd,
            {borderColor: colors.primary, backgroundColor: colors.card},
          ]}
          onPress={onAddPhoto}>
          <Icon name="camera" size={22} color={colors.primary} solid />
          <Text caption1 style={{color: colors.primary, marginTop: 4}}>
            {images.length}/{MAX_PHOTOS}
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  return (
    <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'left']}>
      <Header
        title={t('add_place')}
        renderLeft={() => (
          <Icon
            name="arrow-left"
            size={20}
            color={colors.primary}
            enableRTL={true}
          />
        )}
        onPressLeft={() => navigation.goBack()}
      />
      {loadingForm ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        // Long form: KeyboardAwareScrollView scrolls the focused field above
        // the keyboard and the footer sticks to the keyboard. Don't wrap this in
        // a KeyboardAvoidingView: both would compensate the keyboard (double).
        <View style={styles.flex}>
          <KeyboardAwareScrollView
            // Keep the focused field above the sticky footer (~80px) too.
            bottomOffset={100}
            contentContainerStyle={styles.contain}
            keyboardShouldPersistTaps="handled">
            {renderLabel(t('photos'))}
            {renderPhotos()}

            {renderLabel(t('name'), true)}
            <TextInput
              onChangeText={setTitle}
              placeholder={t('input_place_name')}
              value={title}
              success={success.title}
              onFocus={() => setSuccess({...success, title: true})}
            />

            {renderLabel(t('category'), true)}
            <TouchableOpacity onPress={onSelectCategory}>
              <View
                style={[
                  BaseStyle.textInput,
                  styles.select,
                  {backgroundColor: colors.card},
                ]}>
                <Text
                  body1
                  style={{
                    flex: 1,
                    color: category
                      ? colors.text
                      : success.category
                      ? BaseColor.grayColor
                      : colors.primary,
                  }}>
                  {category?.title ?? t('select_category')}
                </Text>
                <Icon name="angle-down" size={18} color={BaseColor.grayColor} />
              </View>
            </TouchableOpacity>

            {renderLabel(t('description'), true)}
            <TextInput
              style={styles.multiline}
              onChangeText={setContent}
              textAlignVertical="top"
              multiline={true}
              placeholder={t('input_place_description')}
              value={content}
              success={success.content}
              onFocus={() => setSuccess({...success, content: true})}
            />

            {renderLabel(t('address'))}
            <TextInput
              onChangeText={setAddress}
              placeholder={t('input_address')}
              value={address}
            />

            {renderLabel(t('location'))}
            <Text caption1 grayColor style={styles.hint}>
              {t('place_location_hint')}
            </Text>
            <View style={[styles.mapContainer, {borderColor: colors.border}]}>
              <MapView
                // iOS: Apple Maps (no API key needed). Android: Google Maps,
                // needs a valid com.google.android.geo.API_KEY.
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                style={styles.map}
                initialRegion={{
                  ...mapCenter,
                  latitudeDelta: 0.03,
                  longitudeDelta: 0.03,
                }}
                onPress={event => setCoordinate(event.nativeEvent.coordinate)}>
                {coordinate && (
                  <Marker
                    coordinate={coordinate}
                    draggable
                    onDragEnd={event =>
                      setCoordinate(event.nativeEvent.coordinate)
                    }
                  />
                )}
              </MapView>
            </View>

            {renderLabel(t('phone'))}
            <TextInput
              onChangeText={setPhone}
              placeholder="+236 …"
              keyboardType="phone-pad"
              value={phone}
            />

            {renderLabel(t('email'))}
            <TextInput
              onChangeText={setEmail}
              placeholder={t('input_email')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
            />

            {renderLabel(t('website'))}
            <TextInput
              onChangeText={setWebsite}
              placeholder={t('input_website')}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              value={website}
            />
          </KeyboardAwareScrollView>
          <KeyboardStickyView>
            <View style={[styles.footer, {backgroundColor: colors.background}]}>
              <Button full loading={submitting} onPress={onSubmit}>
                {t('add_place_submit')}
              </Button>
            </View>
          </KeyboardStickyView>
        </View>
      )}
    </SafeAreaView>
  );
}
