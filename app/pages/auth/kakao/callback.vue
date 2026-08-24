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
  const code = route.query.code as string | undefined

  if (!code) {
    navigateTo('/login', { replace: true })
    return
  }

  try {
    // Client Secret과 액세스 토큰이 브라우저에 노출되지 않도록 인가 코드를 백엔드에 그대로 전달한다.
    await startSocialLogin('KAKAO', 'AUTHORIZATION_CODE', code)
  } catch {
    track('login_failed', { provider: 'kakao' })
    navigateTo('/login', { replace: true })
  }
})
</script>
