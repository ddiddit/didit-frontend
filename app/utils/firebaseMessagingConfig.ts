export interface FirebaseMessagingConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  vapidKey: string
}

const requiredKeys = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
  'vapidKey',
] as const

export function hasRequiredFirebaseMessagingConfig(config: FirebaseMessagingConfig): boolean {
  return requiredKeys.every((key) => config[key].trim().length > 0)
}

export function buildFirebaseMessagingServiceWorkerUrl(config: FirebaseMessagingConfig): string {
  const params = new URLSearchParams({
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    storageBucket: config.storageBucket,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId,
  })

  return `/firebase-messaging-sw.js?${params.toString()}`
}
