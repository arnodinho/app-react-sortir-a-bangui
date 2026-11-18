import React, {useState} from 'react';
import {
  View,
  ScrollView,
  Platform,
  Alert,
  TouchableOpacity,
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
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
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
import {eventActions} from '@actions';
import {eventDateShort} from '@utils/eventDate';
// Same form layout as AddPlace (photos row, labels, map, sticky footer).
import styles from '../AddPlace/styles';

const MAX_PHOTOS = 8;
const BANGUI = {latitude: 4.3619, longitude: 18.5829};
const pickerOptions = {
  mediaType: 'photo',
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.8,
};

/** Tomorrow 20:00, a sensible starting point for the picker. */
const defaultStart = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(20, 0, 0, 0);
  return date;
};

/**
 * Date + time field. Android: native dialogs (date, then time). iOS: the
 * compact inline picker.
 */
function DateTimeField({value, onChange, minimumDate, placeholder}) {
  const {colors} = useTheme();
  const {i18n} = useTranslation();

  if (Platform.OS === 'ios') {
    return (
      <View style={[BaseStyle.textInput, styles.select, {backgroundColor: colors.card}]}>
        <DateTimePicker
          value={value ?? minimumDate ?? defaultStart()}
          mode="datetime"
          display="compact"
          locale={i18n.language}
          minimumDate={minimumDate}
          minuteInterval={5}
          onChange={(event, date) => date && onChange(date)}
        />
      </View>
    );
  }

  const open = () => {
    const initial = value ?? minimumDate ?? defaultStart();
    DateTimePickerAndroid.open({
      value: initial,
      mode: 'date',
      minimumDate,
      onChange: (event, date) => {
        if (event.type !== 'set') {
          return;
        }
        DateTimePickerAndroid.open({
          value: date,
          mode: 'time',
          is24Hour: true,
          onChange: (timeEvent, time) => {
            if (timeEvent.type === 'set') {
              onChange(time);
            }
          },
        });
      },
    });
  };

  return (
    <TouchableOpacity onPress={open}>
      <View style={[BaseStyle.textInput, styles.select, {backgroundColor: colors.card}]}>
        <Text
          body1
          style={{flex: 1, color: value ? colors.text : BaseColor.grayColor}}>
          {value ? eventDateShort(value, i18n.language) : placeholder}
        </Text>
        <Icon name="calendar-alt" size={18} color={BaseColor.grayColor} />
      </View>
    </TouchableOpacity>
  );
}

export default function AddEvent({navigation, route}) {
  const {colors} = useTheme();
  const {t} = useTranslation();
  const dispatch = useDispatch();

  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [start, setStart] = useState(Platform.OS === 'ios' ? defaultStart() : null);
  const [end, setEnd] = useState(null);
  const [hasEnd, setHasEnd] = useState(false);
  const [venue, setVenue] = useState('');
  const [address, setAddress] = useState('');
  const [coordinate, setCoordinate] = useState(null);
  const [price, setPrice] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [success, setSuccess] = useState({
    title: true,
    content: true,
    venue: true,
    start: true,
  });

  /* Photos (same flow as AddPlace) */

  const onPickedImages = result => {
    if (result.didCancel) {
      return;
    }
    if (result.errorCode) {
      Alert.alert({
        title: t('add_event'),
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
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [t('take_photo'), t('choose_from_library'), t('cancel')],
          cancelButtonIndex: 2,
        },
        index => {
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

  /* Submit */

  const onSubmit = () => {
    const values = {
      title: title.trim(),
      content: content.trim(),
      venue: venue.trim(),
    };
    const valid = {
      title: values.title !== '',
      content: values.content !== '',
      venue: values.venue !== '',
      start: !!start,
    };
    setSuccess(valid);
    if (Object.values(valid).includes(false)) {
      Alert.alert({title: t('add_event'), message: t('event_required_fields')});
      return;
    }
    const endDate = hasEnd ? end : null;
    if (endDate && endDate < start) {
      Alert.alert({title: t('add_event'), message: t('event_end_before_start')});
      return;
    }
    setSubmitting(true);
    dispatch(
      eventActions.onCreateEvent(
        {
          ...values,
          start,
          end: endDate,
          address: address.trim(),
          latitude: coordinate?.latitude,
          longitude: coordinate?.longitude,
          price: price.trim(),
          phone: phone.trim(),
          website: website.trim(),
          images,
        },
        response => {
          setSubmitting(false);
          if (!response.success) {
            Alert.alert({title: t('add_event'), message: response.message});
            return;
          }
          Alert.alert({
            type: 'success',
            title: t('add_event'),
            message: t('event_create_success'),
            action: [
              {
                onPress: () => {
                  route.params?.onCreated?.();
                  navigation.goBack();
                },
              },
            ],
          });
        },
      ),
    );
  };

  /* Render */

  const renderLabel = (label, required = false) => (
    <View style={styles.contentTitle}>
      <Text headline semibold style={{color: required === 'error' ? colors.primary : colors.text}}>
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
            onPress={() =>
              setImages(current => current.filter(i => i.uri !== item.uri))
            }
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
        title={t('add_event')}
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
      <View style={styles.flex}>
        <KeyboardAwareScrollView
          bottomOffset={100}
          contentContainerStyle={styles.contain}
          keyboardShouldPersistTaps="handled">
          {renderLabel(t('photos'))}
          {renderPhotos()}

          {renderLabel(t('event_title'), success.title ? true : 'error')}
          <TextInput
            onChangeText={setTitle}
            placeholder={t('input_event_title')}
            value={title}
            success={success.title}
            onFocus={() => setSuccess({...success, title: true})}
          />

          {renderLabel(t('event_start'), success.start ? true : 'error')}
          <DateTimeField
            value={start}
            minimumDate={new Date()}
            placeholder={t('select_date')}
            onChange={date => {
              setStart(date);
              setSuccess(current => ({...current, start: true}));
            }}
          />

          {hasEnd ? (
            <>
              {renderLabel(t('event_end'))}
              <DateTimeField
                value={end}
                minimumDate={start ?? new Date()}
                placeholder={t('select_date')}
                onChange={setEnd}
              />
            </>
          ) : (
            <TouchableOpacity
              style={styles.contentTitle}
              onPress={() => {
                setHasEnd(true);
                if (Platform.OS === 'ios' && start) {
                  setEnd(new Date(start.getTime() + 3 * 3600 * 1000));
                }
              }}>
              <Text body2 style={{color: colors.primary}}>
                + {t('event_add_end')}
              </Text>
            </TouchableOpacity>
          )}

          {renderLabel(t('event_venue'), success.venue ? true : 'error')}
          <TextInput
            onChangeText={setVenue}
            placeholder={t('input_event_venue')}
            value={venue}
            success={success.venue}
            onFocus={() => setSuccess({...success, venue: true})}
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
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
              style={styles.map}
              initialRegion={{
                ...BANGUI,
                latitudeDelta: 0.03,
                longitudeDelta: 0.03,
              }}
              onPress={e => setCoordinate(e.nativeEvent.coordinate)}>
              {coordinate && (
                <Marker
                  coordinate={coordinate}
                  draggable
                  onDragEnd={e => setCoordinate(e.nativeEvent.coordinate)}
                />
              )}
            </MapView>
          </View>

          {renderLabel(t('description'), success.content ? true : 'error')}
          <TextInput
            style={styles.multiline}
            onChangeText={setContent}
            textAlignVertical="top"
            multiline={true}
            placeholder={t('input_event_description')}
            value={content}
            success={success.content}
            onFocus={() => setSuccess({...success, content: true})}
          />

          {renderLabel(t('price'))}
          <TextInput
            onChangeText={setPrice}
            placeholder={t('input_event_price')}
            value={price}
          />

          {renderLabel(t('phone'))}
          <TextInput
            onChangeText={setPhone}
            placeholder="+236 …"
            keyboardType="phone-pad"
            value={phone}
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
              {t('event_publish')}
            </Button>
          </View>
        </KeyboardStickyView>
      </View>
    </SafeAreaView>
  );
}
