import FirebaseCore
import GoogleMaps
import UIKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  // RNFBMessaging (react-native-firebase's pre-SceneDelegate-era messaging
  // module) reaches for `UIApplicationDelegate.window` directly, which this
  // app never populates — the real window lives on SceneDelegate under the
  // modern multi-scene lifecycle. Without this stored property, accessing
  // it crashes with "unrecognized selector" since no implementation exists
  // to answer the (optional, but still message-able) protocol requirement.
  var window: UIWindow?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    if FirebaseApp.app() == nil {
      FirebaseApp.configure()
    }
    GMSServices.provideAPIKey("AIzaSyBTEuze5QlnyqRKjzXNoRUYJ2ToVqQN1nQ")
    // The API's responses are never meant to be cached, but NSURLSession caches
    // them anyway — including 301 redirects, which it then replays without
    // contacting the server. A server misconfiguration once answered every GET
    // with a self-redirecting 301: affected installs kept looping (home screen
    // stuck loading) long after the server was fixed. Start every launch with an
    // empty HTTP cache. Images are unaffected (SDWebImage has its own cache).
    URLCache.shared.removeAllCachedResponses()
    return true
  }
}
