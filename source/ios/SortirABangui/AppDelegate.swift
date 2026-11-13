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
    GMSServices.provideAPIKey("AIzaSyDvaS7W8iRIZTGJ6v5yePMWF4B2sCEVWqg")
    return true
  }
}
