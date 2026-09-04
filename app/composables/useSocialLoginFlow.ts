import type {
  ApiResponse,
  EmailVerificationStartResponse,
  SocialCredentialType,
  SocialLoginResponse,
  SocialProvider,
} from '~/types/api'

interface PendingSocialLogin {
  loginSessionToken: string
  provider: SocialProvider
  emailHint: string | null
}

const PENDING_LOGIN_KEY = 'pendingSocialLogin'

export function useSocialLoginFlow() {
  const { $api } = useNuxtApp()
  const { track, identify } = useAmplitude()
  const push = usePushNotifications()

  async function startSocialLogin(
    provider: SocialProvider,
    credentialType: SocialCredentialType,
    credential: string,
    redirectUri?: string
  ): Promise<void> {
    const { data } = await $api.post<ApiResponse<SocialLoginResponse>>('/api/v2/auth/social/login', {
      provider,
      credentialType,
      credential,
      ...(redirectUri ? { redirectUri } : {}),
    })
    await handleResult(data.data, provider)
  }

  async function startEmailVerification(email: string): Promise<EmailVerificationStartResponse> {
    const pending = getPendingLogin()
    if (!pending) throw new Error('PENDING_SOCIAL_LOGIN_NOT_FOUND')

    const { data } = await $api.post<ApiResponse<EmailVerificationStartResponse>>('/api/v2/auth/social/email/start', {
      loginSessionToken: pending.loginSessionToken,
      email,
    })
    return data.data
  }

  async function verifyEmail(code: string): Promise<void> {
    const pending = getPendingLogin()
    if (!pending) throw new Error('PENDING_SOCIAL_LOGIN_NOT_FOUND')

    const { data } = await $api.post<ApiResponse<SocialLoginResponse>>('/api/v2/auth/social/email/verify', {
      loginSessionToken: pending.loginSessionToken,
      code,
    })
    await handleResult(data.data, pending.provider)
  }

  function getPendingLogin(): PendingSocialLogin | null {
    if (!import.meta.client) return null
    const raw = sessionStorage.getItem(PENDING_LOGIN_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as PendingSocialLogin
    }
    catch {
      sessionStorage.removeItem(PENDING_LOGIN_KEY)
      return null
    }
  }

  function clearPendingLogin() {
    if (import.meta.client) sessionStorage.removeItem(PENDING_LOGIN_KEY)
  }

  async function handleResult(result: SocialLoginResponse, provider: SocialProvider): Promise<void> {
    if (result.status === 'EMAIL_VERIFICATION_REQUIRED') {
      if (!result.loginSessionToken) throw new Error('LOGIN_SESSION_TOKEN_MISSING')
      const pending: PendingSocialLogin = {
        loginSessionToken: result.loginSessionToken,
        provider,
        emailHint: result.emailHint,
      }
      sessionStorage.setItem(PENDING_LOGIN_KEY, JSON.stringify(pending))
      await navigateTo('/auth/email-verification')
      return
    }

    if (result.status === 'SUPPORT_REQUIRED') {
      clearPendingLogin()
      await navigateTo('/auth/support', { replace: true })
      return
    }

    if (
      !result.accessToken
      || !result.refreshToken
      || result.isNewUser === null
      || result.isOnboardingCompleted === null
    ) {
      throw new Error('AUTH_TOKEN_RESPONSE_INVALID')
    }

    localStorage.setItem('accessToken', result.accessToken)
    localStorage.setItem('refreshToken', result.refreshToken)
    localStorage.setItem('isOnboardingCompleted', String(result.isOnboardingCompleted))
    clearPendingLogin()
    push.syncIfConsented()

    identify(result.accessToken, { provider: provider.toLowerCase() })
    if (result.isNewUser) track('user_signed_up', { provider: provider.toLowerCase() })
    else track('user_logged_in', { provider: provider.toLowerCase() })

    const destination = result.isNewUser || !result.isOnboardingCompleted ? '/onboarding' : '/home'
    await navigateTo(destination, { replace: true })
  }

  return {
    startSocialLogin,
    startEmailVerification,
    verifyEmail,
    getPendingLogin,
    clearPendingLogin,
  }
}
