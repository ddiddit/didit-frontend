<template>
  <div class="h-dvh bg-primary flex flex-col items-center justify-center px-6 text-center">
    <img src="/icon.png" alt="didit" class="w-[80px] h-[80px] mb-8" />
    <p class="text-heading2 text-white font-bold mb-3">서비스 점검 중</p>
    <p class="text-body3 text-white/80 whitespace-pre-line">
      {{ message || '더 나은 서비스를 위해\n점검을 진행하고 있습니다.\n잠시 후 다시 시도해주세요.' }}
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const message = computed(() => route.query.message as string | undefined)
</script>
