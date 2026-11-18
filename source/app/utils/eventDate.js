/**
 * Display helpers for EventModel dates (wall-clock Date objects, see
 * models/event.js). `language` is the i18next language code.
 */
const format = (date, language, options) => {
  try {
    return date.toLocaleString(language, options);
  } catch (e) {
    return date.toLocaleString(undefined, options);
  }
};

const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const hasTime = date => date.getHours() !== 0 || date.getMinutes() !== 0;

/** {day: '12', month: 'DÉC.'} for the calendar badge. */
export const eventDateBadge = (date, language) => {
  if (!date) {
    return {day: '–', month: ''};
  }
  return {
    day: String(date.getDate()),
    month: format(date, language, {month: 'short'})
      .replace('.', '')
      .toUpperCase(),
  };
};

/** "sam. 12 déc. · 20:00" */
export const eventDateShort = (date, language) => {
  if (!date) {
    return '';
  }
  const day = format(date, language, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  return hasTime(date)
    ? `${day} · ${format(date, language, {hour: '2-digit', minute: '2-digit'})}`
    : day;
};

/**
 * Full range for the detail screen:
 * "samedi 12 décembre 2026, 20:00 – 23:00" or
 * "samedi 12 décembre 2026, 20:00 – dimanche 13 décembre 2026, 02:00".
 */
export const eventDateRange = (start, end, language) => {
  if (!start) {
    return '';
  }
  const dayOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  const time = date =>
    format(date, language, {hour: '2-digit', minute: '2-digit'});
  const full = date =>
    hasTime(date)
      ? `${format(date, language, dayOptions)}, ${time(date)}`
      : format(date, language, dayOptions);

  if (!end) {
    return full(start);
  }
  if (sameDay(start, end)) {
    return hasTime(end) ? `${full(start)} – ${time(end)}` : full(start);
  }
  return `${full(start)} – ${full(end)}`;
};
