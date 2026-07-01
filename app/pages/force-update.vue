<template>
  <div class="h-dvh bg-primary flex flex-col items-center justify-center px-6 text-center">
    <img src="/icon.png" alt="didit" class="w-[80px] h-[80px] mb-8" />
    <p class="text-heading2 text-white font-bold mb-3">업데이트가 필요해요</p>
    <p class="text-body3 text-white/80 whitespace-pre-line mb-10">
      더 나은 서비스를 위해{{ '\n' }}최신 버전으로 업데이트해주세요.
    </p>
    <button
      type="button"
      class="w-full max-w-[320px] py-4 rounded-2xl bg-white text-primary text-body2 font-bold active:opacity-80"
      @click="openAppStore"
    >
      업데이트하러 가기
    </button>
  </div>
</template>

<script setup lang="ts">
import { openAppStore } from '~/utils/version'

definePageMeta({ layout: false })
</script>
