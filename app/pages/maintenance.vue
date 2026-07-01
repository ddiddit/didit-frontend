<template>
  <div class="h-dvh bg-primary flex flex-col items-center justify-center px-6 text-center">
    <img src="/icon.png" alt="didit" class="w-[80px] h-[80px] mb-8" />
    <p class="text-heading2 text-white font-bold mb-3">서비스 점검 중</p>
    <p class="text-body3 text-white/80 whitespace-pre-line">
      {{ message || '더 나은 서비스를 위해\n점검을 진행하고 있습니다.\n잠시 후 다시 시도해주세요.' }}
    </p>
    <button
      v-if="isNative"
      type="button"
      class="mt-10 w-full max-w-[320px] py-4 rounded-2xl bg-white text-primary text-body2 font-bold active:opacity-80"
      @click="exit"
    >
      앱 종료
    </button>
  </div>
</template>

<script setup lang="ts">
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'

definePageMeta({ layout: false })

const route = useRoute()
const message = computed(() => route.query.message as string | undefined)

// 네이티브 앱에서는 점검 중 앱을 종료할 수 있게 한다 (웹은 버튼 숨김)
const isNative = Capacitor.isNativePlatform()
function exit() {
  App.exitApp()
}
</script>
