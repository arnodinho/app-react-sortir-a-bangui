#import <EventKit/EventKit.h>
#import <EventKitUI/EventKitUI.h>
#import <React/RCTUtils.h>
#import <SabCalendarSpec/SabCalendarSpec.h>

/**
 * Presents EKEventEditViewController pre-filled. On iOS 17+ this controller
 * runs out of process and needs no calendar permission at all; on iOS 15/16
 * it needs calendar access (NSCalendarsUsageDescription), asked first.
 */
@interface SabCalendar : NSObject <NativeSabCalendarSpec, EKEventEditViewDelegate>
@end

@implementation SabCalendar {
  EKEventStore *_store;
  RCTPromiseResolveBlock _resolve;
}

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (void)addEvent:(NSString *)title
       startDate:(double)startDate
         endDate:(double)endDate
          allDay:(BOOL)allDay
        location:(NSString *)location
           notes:(NSString *)notes
             url:(NSString *)url
         resolve:(RCTPromiseResolveBlock)resolve
          reject:(RCTPromiseRejectBlock)reject
{
  if (!_store) {
    _store = [EKEventStore new];
  }

  void (^present)(void) = ^{
    dispatch_async(dispatch_get_main_queue(), ^{
      UIViewController *presenter = RCTPresentedViewController();
      if (!presenter) {
        reject(@"no_view_controller", @"No view controller to present from", nil);
        return;
      }
      EKEvent *event = [EKEvent eventWithEventStore:self->_store];
      event.title = title;
      event.startDate = [NSDate dateWithTimeIntervalSince1970:startDate / 1000.0];
      event.endDate = [NSDate dateWithTimeIntervalSince1970:endDate / 1000.0];
      event.allDay = allDay;
      if (location.length) {
        event.location = location;
      }
      if (notes.length) {
        event.notes = notes;
      }
      if (url.length) {
        event.URL = [NSURL URLWithString:url];
      }

      EKEventEditViewController *controller = [EKEventEditViewController new];
      controller.eventStore = self->_store;
      controller.event = event;
      controller.editViewDelegate = self;
      self->_resolve = resolve;
      [presenter presentViewController:controller animated:YES completion:nil];
    });
  };

  if (@available(iOS 17.0, *)) {
    present();
    return;
  }
  [_store requestAccessToEntityType:EKEntityTypeEvent
                         completion:^(BOOL granted, NSError *error) {
                           if (granted) {
                             present();
                           } else {
                             reject(@"permission_denied", @"Calendar access denied", error);
                           }
                         }];
}

- (void)eventEditViewController:(EKEventEditViewController *)controller
          didCompleteWithAction:(EKEventEditViewAction)action
{
  RCTPromiseResolveBlock resolve = _resolve;
  _resolve = nil;
  [controller dismissViewControllerAnimated:YES
                                 completion:^{
                                   if (resolve) {
                                     resolve(action == EKEventEditViewActionSaved ? @"saved" : @"canceled");
                                   }
                                 }];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeSabCalendarSpecJSI>(params);
}

@end
