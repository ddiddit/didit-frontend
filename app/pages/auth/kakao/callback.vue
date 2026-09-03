<template>
  <div class="h-dvh bg-primary flex items-center justify-center">
    <img src="/icon.png" alt="didit" class="w-[80px] h-[80px]" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const { track } = useAmplitude()
const { startSocialLogin } = useSocialLoginFlow()

const route = useRoute()

onMounted(async () => {
  const code = typeof route.query.code === 'string' ? route.query.code : undefined

  if (!code) {
    await navigateTo('/login', { replace: true })
    return
  }

  try {
    // Client Secret과 액세스 토큰이 브라우저에 노출되지 않도록 인가 코드를 백엔드에 그대로 전달한다.
    await startSocialLogin(
      'KAKAO',
      'AUTHORIZATION_CODE',
      code,
      `${window.location.origin}/auth/kakao/callback`,
    )
  } catch (error) {
    console.error('[kakao-login-error]', error)
    track('login_failed', { provider: 'kakao' })
    navigateTo('/login', { replace: true })
  }
})
</script>
