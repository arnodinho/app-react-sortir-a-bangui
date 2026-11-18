package com.ayanga.sabcalendar

import android.content.ActivityNotFoundException
import android.content.Intent
import android.provider.CalendarContract
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext

/**
 * Opens the calendar app's "new event" screen via ACTION_INSERT: works with
 * any calendar app and needs no calendar permission. The calendar app doesn't
 * report whether the user saved, so this resolves "opened".
 */
class SabCalendarModule(reactContext: ReactApplicationContext) :
  NativeSabCalendarSpec(reactContext) {

  override fun getName(): String = NAME

  override fun addEvent(
    title: String,
    startDate: Double,
    endDate: Double,
    allDay: Boolean,
    location: String,
    notes: String,
    url: String,
    promise: Promise,
  ) {
    val description = listOf(notes, url).filter { it.isNotBlank() }.joinToString("\n\n")
    val intent = Intent(Intent.ACTION_INSERT)
      .setData(CalendarContract.Events.CONTENT_URI)
      .putExtra(CalendarContract.Events.TITLE, title)
      .putExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME, startDate.toLong())
      .putExtra(CalendarContract.EXTRA_EVENT_END_TIME, endDate.toLong())
      .putExtra(CalendarContract.EXTRA_EVENT_ALL_DAY, allDay)
      .putExtra(CalendarContract.Events.EVENT_LOCATION, location)
      .putExtra(CalendarContract.Events.DESCRIPTION, description)
    val activity = reactApplicationContext.currentActivity
    try {
      if (activity != null) {
        activity.startActivity(intent)
      } else {
        reactApplicationContext.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      }
      promise.resolve("opened")
    } catch (e: ActivityNotFoundException) {
      promise.reject("no_calendar_app", "No calendar app installed", e)
    }
  }

  companion object {
    const val NAME = "SabCalendar"
  }
}
