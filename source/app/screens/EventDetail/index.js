import React, {useEffect, useState} from 'react';
import {
  Alert,
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  Share,
  StyleSheet,
} from 'react-native';
import {useDispatch} from 'react-redux';
import {useTranslation} from 'react-i18next';
import PagerView from 'react-native-pager-view';
import MapView, {PROVIDER_GOOGLE, Marker} from 'react-native-maps';
import {
  Placeholder,
  PlaceholderLine,
  PlaceholderMedia,
  Progressive,
} from 'rn-placeholder';
import {BaseStyle, BaseColor, useTheme} from '@config';
import {
  Header,
  SafeAreaView,
  Icon,
  Text,
  Image,
  Button,
  PaginationDots,
} from '@components';
import {eventActions} from '@actions';
import {eventDateRange} from '@utils/eventDate';
import {eventInstant} from '@models/event';
import {addEventToCalendar} from 'sab-calendar';

export default function EventDetail({navigation, route}) {
  const {colors} = useTheme();
  const {t, i18n} = useTranslation();
  const dispatch = useDispatch();
  const id = route.params?.id;

  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    dispatch(
      eventActions.onLoadEvent(id, res => {
        if (res.success) {
          setEvent(res.event);
        } else {
          setError(res.message);
        }
      }),
    );
  }, [dispatch, id]);

  const gallery = event?.gallery?.length
    ? event.gallery
    : [event?.image].filter(image => image?.full && image.full !== 'unknown');

  const coordinate = {
    latitude: parseFloat(event?.location?.latitude),
    longitude: parseFloat(event?.location?.longitude),
  };
  const hasCoordinates =
    Number.isFinite(coordinate.latitude) &&
    Number.isFinite(coordinate.longitude) &&
    !(coordinate.latitude === 0 && coordinate.longitude === 0);

  const onDirections = () => {
    const {latitude, longitude} = coordinate;
    const label = encodeURIComponent(event?.venue ?? event?.title ?? '');
    Linking.openURL(
      Platform.OS === 'ios'
        ? `maps:?q=${label}&ll=${latitude},${longitude}`
        : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`,
    );
  };

  /**
   * Opens the system "new event" screen, pre-filled. No end date: 2 hours;
   * date without a time (00:00): all-day event.
   */
  const onAddToCalendar = async () => {
    const start = eventInstant(event.start);
    const allDay =
      event.start.getHours() === 0 && event.start.getMinutes() === 0 && !event.end;
    const end = event.end
      ? eventInstant(event.end)
      : new Date(start.getTime() + (allDay ? 24 : 2) * 3600 * 1000);
    try {
      const result = await addEventToCalendar({
        title: event.title,
        startDate: start,
        endDate: end,
        allDay,
        location: [event.venue, event.address].filter(Boolean).join(', '),
        notes: event.content,
        url: event.link,
      });
      if (result === 'saved') {
        Alert.alert({
          type: 'success',
          title: t('add_to_calendar'),
          message: t('add_to_calendar_success'),
        });
      }
    } catch (e) {
      Alert.alert({
        title: t('add_to_calendar'),
        message:
          e?.code === 'permission_denied'
            ? t('add_to_calendar_permission')
            : t('add_to_calendar_error'),
      });
    }
  };

  const onShare = () => {
    Share.share({
      title: event?.title,
      message: [
        event?.title,
        eventDateRange(event?.start, event?.end, i18n.language),
        event?.venue,
        event?.link,
      ]
        .filter(Boolean)
        .join('\n'),
    });
  };

  const renderGallery = () => {
    if (!gallery.length) {
      return (
        <View style={[styles.banner, styles.noImage, {backgroundColor: colors.primaryLight}]}>
          <Icon name="calendar-alt" size={48} color={BaseColor.whiteColor} />
        </View>
      );
    }
    return (
      <View style={styles.banner}>
        <PagerView
          style={styles.flex}
          initialPage={0}
          onPageSelected={e => setPage(e.nativeEvent.position)}>
          {gallery.map((image, index) => (
            <TouchableOpacity
              key={`${image.full}${index}`}
              activeOpacity={0.9}
              onPress={() =>
                navigation.navigate('PreviewImage', {gallery})
              }>
              <Image source={{uri: image.full}} style={styles.bannerImage} />
            </TouchableOpacity>
          ))}
        </PagerView>
        {gallery.length > 1 && (
          <PaginationDots
            style={styles.dots}
            count={gallery.length}
            activeIndex={page}
            dotStyle={{backgroundColor: BaseColor.whiteColor}}
            activeDotColor={colors.primary}
          />
        )}
      </View>
    );
  };

  const renderLine = (icon, label, value, onPress) => {
    if (!value) {
      return null;
    }
    return (
      <TouchableOpacity style={styles.line} disabled={!onPress} onPress={onPress}>
        <View style={[styles.lineIcon, {backgroundColor: colors.primaryLight}]}>
          <Icon name={icon} size={16} color={BaseColor.whiteColor} solid />
        </View>
        <View style={styles.lineContent}>
          <Text caption2 grayColor>
            {label}
          </Text>
          <Text
            footnote
            semibold
            style={[styles.lineValue, onPress && {color: colors.primary}]}>
            {value}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderLoading = () => (
    <Placeholder Animation={Progressive}>
      <PlaceholderMedia style={styles.banner} />
      <View style={styles.content}>
        <PlaceholderLine style={{width: '70%', height: 20}} />
        <PlaceholderLine style={{width: '50%'}} />
        <PlaceholderLine style={{width: '60%'}} />
        <PlaceholderLine style={{width: '100%', height: 180, marginTop: 20}} />
      </View>
    </Placeholder>
  );

  const renderContent = () => (
    <ScrollView contentContainerStyle={styles.scroll}>
      {renderGallery()}
      <View style={styles.content}>
        {event.status === 'pending' && (
          <View style={[styles.pending, {backgroundColor: colors.card}]}>
            <Text caption1>{t('event_pending')}</Text>
          </View>
        )}
        <Text title2 semibold>
          {event.title}
        </Text>

        {renderLine(
          'calendar-alt',
          t('date'),
          eventDateRange(event.start, event.end, i18n.language),
        )}
        {renderLine(
          'map-marker-alt',
          t('event_venue'),
          [event.venue, event.address].filter(Boolean).join('\n'),
        )}
        {!!event.start && (
          <Button
            outline
            style={styles.directions}
            icon={
              <Icon
                name="calendar-plus"
                size={16}
                color={colors.primary}
                style={styles.buttonIcon}
              />
            }
            onPress={onAddToCalendar}>
            {t('add_to_calendar')}
          </Button>
        )}
        {renderLine('ticket-alt', t('price'), event.price)}
        {renderLine('mobile-alt', t('tel'), event.phone, () =>
          Linking.openURL(`tel:${event.phone}`),
        )}
        {renderLine('globe', t('website'), event.website, () =>
          Linking.openURL(event.website),
        )}

        {!!event.content && (
          <>
            <Text title3 semibold style={styles.section}>
              {t('description')}
            </Text>
            <Text body2 style={styles.description}>
              {event.content}
            </Text>
          </>
        )}

        {hasCoordinates && (
          <>
            <Text title3 semibold style={styles.section}>
              {t('location')}
            </Text>
            <View style={[styles.mapContainer, {borderColor: colors.border}]}>
              <MapView
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                style={styles.map}
                initialRegion={{
                  ...coordinate,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.009,
                }}>
                <Marker coordinate={coordinate} title={event.venue} />
              </MapView>
            </View>
            <Button outline style={styles.directions} onPress={onDirections}>
              {t('directions')}
            </Button>
          </>
        )}

        {event.placeId && (
          <Button
            style={styles.directions}
            onPress={() =>
              navigation.navigate('ProductDetail', {id: event.placeId})
            }>
            {t('see_place')}
          </Button>
        )}
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.flex}>
      <Header
        title={t('event_detail')}
        renderLeft={() => (
          <Icon
            name="arrow-left"
            size={20}
            color={colors.primary}
            enableRTL={true}
          />
        )}
        onPressLeft={() => navigation.goBack()}
        renderRight={() =>
          event ? <Icon name="share-alt" size={20} color={colors.primary} /> : null
        }
        onPressRight={event ? onShare : undefined}
      />
      <SafeAreaView style={BaseStyle.safeAreaView} edges={['right', 'left']}>
        {error ? (
          <View style={styles.center}>
            <Text body2 grayColor>
              {error}
            </Text>
          </View>
        ) : event ? (
          renderContent()
        ) : (
          renderLoading()
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20},
  scroll: {paddingBottom: 40},
  banner: {width: '100%', height: 250},
  bannerImage: {width: '100%', height: '100%'},
  noImage: {alignItems: 'center', justifyContent: 'center'},
  dots: {position: 'absolute', bottom: 10, left: 0, right: 0},
  content: {paddingHorizontal: 20, paddingTop: 15},
  pending: {padding: 10, borderRadius: 8, marginBottom: 10},
  line: {flexDirection: 'row', alignItems: 'center', marginTop: 16},
  lineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineContent: {marginLeft: 10, flex: 1},
  lineValue: {marginTop: 3},
  section: {marginTop: 25, marginBottom: 10},
  description: {lineHeight: 20},
  mapContainer: {
    height: 180,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  // Explicit size: absoluteFillObject leaves the map blank under Fabric.
  map: {width: '100%', height: '100%'},
  directions: {marginTop: 15},
  buttonIcon: {marginRight: 8},
});
