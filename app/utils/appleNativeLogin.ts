interface AppleNativeResult {
  idToken?: string | null
  authorizationCode?: string | null
}

export function createAppleNativeConfig(clientId: string) {
  return {
    clientId,
    useProperTokenExchange: true,
  }
}

export function getAppleNativeCredentials(result: AppleNativeResult) {
  const idToken = result.idToken?.trim()
  const authorizationCode = result.authorizationCode?.trim()
  if (!idToken || !authorizationCode) return null
  return { idToken, authorizationCode }
}
