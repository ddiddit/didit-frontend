import UIKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(
        _ scene: UIScene,
        willConnectTo session: UISceneSession,
        options connectionOptions: UIScene.ConnectionOptions
    ) {
        guard scene is UIWindowScene else { return }

        for context in connectionOptions.urlContexts {
            _ = handleOpenURLContext(context)
        }

        for userActivity in connectionOptions.userActivities {
            _ = AppDelegate.handleUserActivity(
                UIApplication.shared,
                userActivity: userActivity,
                restorationHandler: { _ in }
            )
        }
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        for context in URLContexts {
            _ = handleOpenURLContext(context)
        }
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        _ = AppDelegate.handleUserActivity(
            UIApplication.shared,
            userActivity: userActivity,
            restorationHandler: { _ in }
        )
    }

    private func handleOpenURLContext(_ context: UIOpenURLContext) -> Bool {
        var options: [UIApplication.OpenURLOptionsKey: Any] = [
            .openInPlace: context.options.openInPlace
        ]

        if let sourceApplication = context.options.sourceApplication {
            options[.sourceApplication] = sourceApplication
        }
        if let annotation = context.options.annotation {
            options[.annotation] = annotation
        }
        if let eventAttribution = context.options.eventAttribution {
            options[.eventAttribution] = eventAttribution
        }

        return AppDelegate.handleOpenURL(UIApplication.shared, url: context.url, options: options)
    }
}
