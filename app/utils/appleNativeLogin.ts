interface AppleNativeResult {
  idToken?: string | null
  authorizationCode?: string | null
  accessToken?: {
    token?: string | null
  } | null
}

export function createAppleNativeConfig(clientId: string) {
  return {
    clientId,
    useProperTokenExchange: false,
  }
}

export function getAppleNativeCredentials(result: AppleNativeResult) {
  const idToken = result.idToken?.trim()
  const authorizationCode =
    result.authorizationCode?.trim() || result.accessToken?.token?.trim()
  if (!idToken || !authorizationCode) return null
  return { idToken, authorizationCode }
}
