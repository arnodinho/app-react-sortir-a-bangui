import React from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import {useTranslation} from 'react-i18next';
import {Placeholder, PlaceholderLine, Progressive, PlaceholderMedia} from 'rn-placeholder';
import {BaseColor, useTheme} from '@config';
import {eventDateBadge, eventDateShort} from '@utils/eventDate';
import Image from '../Image';
import Text from '../Text';
import Icon from '../Icon';

/**
 * An Agenda event: photo with a calendar badge, title, date and venue.
 * `grid` = fixed-width card for horizontal lists (Home), otherwise a
 * full-width row (EventList).
 */
export default function EventCard({
  event,
  grid = false,
  loading = false,
  style,
  onPress,
}) {
  const {colors} = useTheme();
  const {i18n} = useTranslation();

  if (loading) {
    return (
      <Placeholder Animation={Progressive} style={style}>
        <PlaceholderMedia style={grid ? styles.gridImage : styles.rowImage} />
        <PlaceholderLine style={{width: '70%', marginTop: 8}} />
        <PlaceholderLine style={{width: '50%'}} />
      </Placeholder>
    );
  }

  const badge = eventDateBadge(event?.start, i18n.language);
  const hasImage = event?.image?.full && event.image.full !== 'unknown';

  return (
    <TouchableOpacity style={style} onPress={onPress} activeOpacity={0.9}>
      <View>
        {hasImage ? (
          <Image
            source={{uri: event.image.full}}
            style={grid ? styles.gridImage : styles.rowImage}
          />
        ) : (
          <View
            style={[
              grid ? styles.gridImage : styles.rowImage,
              styles.noImage,
              {backgroundColor: colors.primaryLight},
            ]}>
            <Icon name="calendar-alt" size={32} color={BaseColor.whiteColor} />
          </View>
        )}
        <View style={[styles.badge, {backgroundColor: colors.background}]}>
          <Text title3 bold style={{color: colors.primary}}>
            {badge.day}
          </Text>
          <Text caption2 semibold>
            {badge.month}
          </Text>
        </View>
      </View>
      <Text headline semibold numberOfLines={2} style={styles.title}>
        {event?.title}
      </Text>
      <View style={styles.line}>
        <Icon name="clock" size={12} color={BaseColor.grayColor} />
        <Text caption1 grayColor style={styles.lineText} numberOfLines={1}>
          {eventDateShort(event?.start, i18n.language)}
        </Text>
      </View>
      {!!event?.venue && (
        <View style={styles.line}>
          <Icon name="map-marker-alt" size={12} color={BaseColor.grayColor} />
          <Text caption1 grayColor style={styles.lineText} numberOfLines={1}>
            {event.venue}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gridImage: {width: '100%', height: 120, borderRadius: 8},
  rowImage: {width: '100%', height: 170, borderRadius: 8},
  noImage: {alignItems: 'center', justifyContent: 'center'},
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    minWidth: 44,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  title: {marginTop: 8},
  line: {flexDirection: 'row', alignItems: 'center', marginTop: 4},
  lineText: {marginLeft: 6, flex: 1},
});
