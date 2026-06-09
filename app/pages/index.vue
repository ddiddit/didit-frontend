<template>
  <div class="h-dvh bg-primary flex items-center justify-center">
    <img src="/icon.png" alt="didit" class="w-[100px] h-[100px]" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

onMounted(() => {
  const token = localStorage.getItem('accessToken')
  navigateTo(token ? '/home' : '/auth/login', { replace: true })
})
</script>
