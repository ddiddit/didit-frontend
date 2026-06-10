<template>
  <div class="h-dvh bg-primary flex items-center justify-center">
    <img src="/icon.png" alt="didit" class="w-[100px] h-[100px]" />
  </div>
</template>

<script setup lang="ts">
import type { ApiResponse, AppConfig, UserProfile } from '~/types/api'

definePageMeta({ layout: false })

const { $api } = useNuxtApp()
const authStore = useAuthStore()

onMounted(async () => {
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000))

  try {
    // 앱 설정 조회 (점검 모드 확인)
    const configResult = await Promise.race([
      $api.get<ApiResponse<AppConfig>>('/api/v1/app/config').then((res) => res.data.data),
      timeout,
    ])

    if (!configResult) {
      navigateTo('/auth/login', { replace: true })
      return
    }

    if (configResult.maintenanceMode) {
      navigateTo(
        { path: '/maintenance', query: { message: configResult.maintenanceMessage ?? undefined } },
        { replace: true },
      )
      return
    }

    // 자동 로그인 시도
    const accessToken = localStorage.getItem('accessToken')
    if (!accessToken) {
      navigateTo('/auth/login', { replace: true })
      return
    }

    const userResult = await Promise.race([
      $api.get<ApiResponse<UserProfile>>('/api/v1/users/me').then((res) => res.data.data),
      timeout,
    ])

    if (userResult) {
      authStore.setUser(userResult)
      navigateTo('/home', { replace: true })
    } else {
      navigateTo('/auth/login', { replace: true })
    }
  } catch {
    navigateTo('/auth/login', { replace: true })
  }
})
</script>
