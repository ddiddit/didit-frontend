<template>
  <div class="h-dvh bg-primary flex items-center justify-center">
    <img src="/icon.png" alt="didit" class="w-[80px] h-[80px]" />
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse, TokenResponse } from '~/types/api'

definePageMeta({ layout: false })

const route = useRoute()
const config = useRuntimeConfig()
const { $api } = useNuxtApp()

onMounted(async () => {
  const code = route.query.code as string | undefined

  if (!code) {
    navigateTo('/login', { replace: true })
    return
  }

  try {
    // 인가 코드를 카카오 액세스 토큰으로 교환
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.public.kakaoRestKey,
      redirect_uri: `${window.location.origin}/auth/kakao/callback`,
      code,
    })

    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })

    const tokenData = await tokenRes.json()

    if (!tokenData.access_token) {
      navigateTo('/login', { replace: true })
      return
    }

    // 백엔드 로그인 API 호출
    const { data } = await $api.post<ApiResponse<TokenResponse>>('/api/v1/auth/login', {
      provider: 'KAKAO',
      oauthToken: tokenData.access_token,
    })

    localStorage.setItem('accessToken', data.data.accessToken)
    localStorage.setItem('refreshToken', data.data.refreshToken)
    localStorage.setItem('isOnboardingCompleted', String(data.data.isOnboardingCompleted))

    const dest = data.data.isNewUser || !data.data.isOnboardingCompleted ? '/onboarding' : '/home'
    navigateTo(dest, { replace: true })
  } catch {
    navigateTo('/login', { replace: true })
  }
})
</script>
