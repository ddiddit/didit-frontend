<template>
  <div class="h-dvh bg-primary flex items-center justify-center">
    <img src="/icon.png" alt="didit" class="w-[100px] h-[100px]" />
  </div>
</template>

<script setup lang="ts">
import { Capacitor } from '@capacitor/core'
import type { ApiResponse, AppConfig } from '~/types/api'
import { getCurrentAppVersion, isVersionLower } from '~/utils/version'

definePageMeta({ layout: false })

const { $api } = useNuxtApp()
const runtimeConfig = useRuntimeConfig()

onMounted(async () => {
  // 이미 로그인된 경우 스플래시 없이 즉시 이동
  if (localStorage.getItem('accessToken') && localStorage.getItem('refreshToken')) {
    const isOnboardingCompleted = localStorage.getItem('isOnboardingCompleted')
    if (isOnboardingCompleted === null) {
      localStorage.clear()
      navigateTo('/login', { replace: true })
      return
    }
    navigateTo(isOnboardingCompleted === 'true' ? '/home' : '/onboarding', { replace: true })
    return
  }

  const minDisplay = new Promise<void>((resolve) => setTimeout(resolve, 2000))
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000))

  try {
    // 앱 설정 조회와 최소 표시 시간을 병렬로 대기
    const [configResult] = await Promise.all([
      Promise.race([
        $api.get<ApiResponse<AppConfig>>('/api/v1/app/config').then((res) => res.data.data),
        timeout,
      ]),
      minDisplay,
    ])

    if (!configResult) {
      navigateTo('/login', { replace: true })
      return
    }

    if (configResult.maintenanceMode) {
      navigateTo(
        { path: '/maintenance', query: { message: configResult.maintenanceMessage ?? undefined } },
        { replace: true },
      )
      return
    }

    // 네이티브 앱이 최소 버전 미만이면 강제 업데이트 화면으로 이동 (웹은 항상 최신이라 제외)
    if (Capacitor.isNativePlatform() && configResult.minimumVersion) {
      const current = await getCurrentAppVersion(runtimeConfig.public.appVersion as string)
      if (isVersionLower(current, configResult.minimumVersion)) {
        navigateTo('/force-update', { replace: true })
        return
      }
    }

    const accessToken = localStorage.getItem('accessToken')
    if (!accessToken) {
      navigateTo('/login', { replace: true })
      return
    }

    // 온보딩 미완료 시 온보딩으로 이동
    const isOnboardingCompleted = localStorage.getItem('isOnboardingCompleted')
    if (isOnboardingCompleted === null) {
      localStorage.clear()
      navigateTo('/login', { replace: true })
      return
    }
    navigateTo(isOnboardingCompleted === 'true' ? '/home' : '/onboarding', { replace: true })
  } catch {
    navigateTo('/login', { replace: true })
  }
})
</script>
