import ImageModel from './image';
import LocationModel from './location';

/**
 * Parses the backend's local wall-clock datetime ("Y-m-d H:i:s", Bangui
 * time) into a Date with the same wall-clock values, so formatting it on the
 * device shows the event's own time whatever the device's time zone.
 */
export const parseEventDate = value => {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/.exec(
    value ?? '',
  );
  if (!match) {
    return null;
  }
  const [, y, m, d, h = '0', i = '0'] = match;
  return new Date(+y, +m - 1, +d, +h, +i);
};

/** Inverse of parseEventDate: Date -> "YYYY-MM-DD HH:mm" (wall clock). */
export const formatEventDateForApi = date => {
  if (!date) {
    return undefined;
  }
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/**
 * Bangui is on WAT, UTC+1 all year (no DST). Converts an event's wall-clock
 * Date (see parseEventDate) to the real instant, for the device calendar.
 */
const BANGUI_UTC_OFFSET_MS = 60 * 60 * 1000;
export const eventInstant = date =>
  date
    ? new Date(
        Date.UTC(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          date.getHours(),
          date.getMinutes(),
        ) - BANGUI_UTC_OFFSET_MS,
      )
    : null;

/** An event of the Agenda (custom post type sab_event, sab/v1/events). */
export default class EventModel {
  constructor(json) {
    this.id = json?.ID?.toString();
    this.title = json?.post_title;
    this.excerpt = json?.excerpt;
    this.content = json?.content;
    this.status = json?.status;
    this.start = parseEventDate(json?.start);
    this.end = parseEventDate(json?.end);
    this.venue = json?.venue;
    this.address = json?.address;
    this.price = json?.price;
    this.phone = json?.phone;
    this.website = json?.website;
    this.link = json?.link;
    this.placeId = json?.place_id?.toString();
    this.authorName = json?.author?.name;
    this.image = json?.image ? new ImageModel(json.image) : null;
    this.gallery = (json?.galleries ?? []).map(item => new ImageModel(item));
    this.location = new LocationModel({
      name: json?.venue ?? json?.post_title,
      latitude: json?.latitude,
      longitude: json?.longitude,
    });
  }
}
