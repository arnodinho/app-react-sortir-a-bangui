import NativeSabCalendar from './NativeSabCalendar';

/**
 * @param {{title: string, startDate: Date, endDate: Date, allDay?: boolean,
 *   location?: string, notes?: string, url?: string}} event
 * @returns {Promise<'saved'|'canceled'|'opened'>}
 */
export function addEventToCalendar({
  title,
  startDate,
  endDate,
  allDay = false,
  location = '',
  notes = '',
  url = '',
}) {
  return NativeSabCalendar.addEvent(
    title ?? '',
    startDate.getTime(),
    endDate.getTime(),
    allDay,
    location ?? '',
    notes ?? '',
    url ?? '',
  );
}
