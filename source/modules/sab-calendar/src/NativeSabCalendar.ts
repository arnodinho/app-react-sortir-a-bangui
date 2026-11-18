import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

export interface Spec extends TurboModule {
  /**
   * Shows the system "new event" screen, pre-filled. Dates are epoch ms.
   * Resolves 'saved' | 'canceled' (iOS) or 'opened' (Android: the calendar
   * app doesn't report back).
   */
  addEvent(
    title: string,
    startDate: number,
    endDate: number,
    allDay: boolean,
    location: string,
    notes: string,
    url: string,
  ): Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SabCalendar');
