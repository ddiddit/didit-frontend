<template>
  <div class="h-dvh bg-primary flex flex-col">
    <!-- 상단: 헤드라인 (중앙 정렬) -->
    <div class="flex-1 flex flex-col items-center justify-center px-6 safe-top text-center">
      <img src="/heading-login.svg" alt="Growth through your didit. 더 간단해진 회고, 디딧" class="w-full max-w-[280px] h-auto" />
    </div>

    <!-- 하단: 소셜 로그인 버튼 -->
    <div class="px-5 pb-12 safe-bottom">
      <p class="text-label1 text-center mb-5" style="color: #1B6345;">SNS 계정으로 간편 회원가입</p>

      <div class="flex flex-col gap-[10px]">
        <!-- Google -->
        <button
          class="w-full h-14 bg-white rounded-xl flex items-center justify-center text-body2 font-medium text-[#191919] disabled:opacity-50"
          :disabled="isLoading"
          @click="loginWithGoogle"
        >
          <div ref="googleContent" class="flex items-center gap-2">
            <svg class="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Google로 시작하기</span>
          </div>
        </button>

        <!-- Kakao -->
        <button
          class="w-full h-14 bg-[#FEE500] rounded-xl flex items-center justify-center text-body2 font-medium text-[#181600] disabled:opacity-50"
          :disabled="isLoading"
          @click="loginWithKakao"
        >
          <div class="flex items-center gap-2" :style="{ minWidth: syncWidth }">
            <svg class="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path fill="#181600" d="M12 4C6.92 4 3 7.28 3 11.25c0 2.56 1.54 4.81 3.89 6.1l-.77 2.86 3.37-1.97c.79.14 1.61.22 2.51.22 5.08 0 9-3.28 9-7.21S17.08 4 12 4z"/>
            </svg>
            <span>Kakao로 시작하기</span>
          </div>
        </button>

        <!-- Apple -->
        <button
          class="w-full h-14 bg-gray-900 rounded-xl flex items-center justify-center text-body2 font-medium text-white disabled:opacity-50"
          :disabled="isLoading"
          @click="loginWithApple"
        >
          <div class="flex items-center gap-2" :style="{ minWidth: syncWidth }">
            <svg class="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path fill="white" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.39-1.32 2.76-2.54 4zm-3.1-17.42c.02 2.2-1.9 4.02-3.93 3.84-.27-2.13 1.9-4.1 3.93-3.84z"/>
            </svg>
            <span>Apple로 시작하기</span>
          </div>
        </button>
      </div>

      <p v-if="errorMessage" class="text-red-400 text-center text-sm mt-4">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse, TokenResponse } from '~/types/api'

// 각 SDK의 최소 타입 선언
declare const Kakao: {
  isInitialized: () => boolean
  init: (key: string) => void
  Auth: {
    authorize: (opts: { redirectUri: string }) => void
  }
}
declare const google: {
  accounts: {
    id: {
      initialize: (cfg: {
        client_id: string
        callback: (res: { credential: string }) => void
        cancel_on_tap_outside?: boolean
      }) => void
      prompt: (cb?: (n: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void
    }
  }
}
declare const AppleID: {
  auth: {
    init: (cfg: { clientId: string; scope: string; redirectURI: string; usePopup: boolean }) => void
    signIn: () => Promise<{ authorization: { id_token: string } }>
  }
}

definePageMeta({ layout: false })

const { $api } = useNuxtApp()
const config = useRuntimeConfig()
const googleContent = ref<HTMLElement | null>(null)
const syncWidth = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

onMounted(async () => {
  if (localStorage.getItem('accessToken')) {
    navigateTo('/home', { replace: true })
    return
  }

  await nextTick()
  if (googleContent.value) {
    syncWidth.value = `${googleContent.value.offsetWidth}px`
  }

  // Google, Apple SDK 로딩 (카카오는 직접 URL 방식으로 SDK 불필요)
  await Promise.all([
    loadScript('https://accounts.google.com/gsi/client'),
    loadScript('https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js'),
  ])

  google.accounts.id.initialize({
    client_id: config.public.googleClientId,
    callback: (res) => submitLogin('GOOGLE', res.credential),
    cancel_on_tap_outside: true,
  })
})

function loadScript(src: string): Promise<void> {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const el = document.createElement('script')
    el.src = src
    el.onload = () => resolve()
    el.onerror = () => resolve()
    document.head.appendChild(el)
  })
}

async function submitLogin(provider: 'KAKAO' | 'GOOGLE' | 'APPLE', oauthToken: string) {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const { data } = await $api.post<ApiResponse<TokenResponse>>('/api/v1/auth/login', { provider, oauthToken })
    localStorage.setItem('accessToken', data.data.accessToken)
    localStorage.setItem('refreshToken', data.data.refreshToken)

    const dest = data.data.isNewUser || !data.data.isOnboardingCompleted ? '/onboarding' : '/home'
    navigateTo(dest, { replace: true })
  } catch {
    errorMessage.value = '로그인에 실패했습니다. 다시 시도해주세요.'
  } finally {
    isLoading.value = false
  }
}

function loginWithKakao() {
  errorMessage.value = ''
  const redirectUri = encodeURIComponent(`${window.location.origin}/auth/kakao/callback`)
  window.location.href = `https://kauth.kakao.com/oauth/authorize?client_id=${config.public.kakaoRestKey}&redirect_uri=${redirectUri}&response_type=code`
}

function loginWithGoogle() {
  errorMessage.value = ''
  google.accounts.id.prompt((notification) => {
    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
      errorMessage.value = 'Google 로그인 창이 표시되지 않았습니다. 팝업 차단을 해제해주세요.'
    }
  })
}

async function loginWithApple() {
  errorMessage.value = ''
  AppleID.auth.init({
    clientId: config.public.appleClientId,
    scope: 'name email',
    redirectURI: window.location.origin,
    usePopup: true,
  })
  try {
    const result = await AppleID.auth.signIn()
    await submitLogin('APPLE', result.authorization.id_token)
  } catch {
    errorMessage.value = 'Apple 로그인에 실패했습니다.'
  }
}
</script>
