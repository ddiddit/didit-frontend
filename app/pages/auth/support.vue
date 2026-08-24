<template>
  <main class="flex min-h-dvh flex-col items-center justify-center bg-white px-6 text-center safe-bottom">
    <div class="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
      <Icon name="material-symbols:shield-person-rounded" class="h-8 w-8 text-grey-10" />
    </div>
    <h1 class="mt-6 text-title1 font-bold text-grey-10">계정 확인이 필요해요</h1>
    <p class="mt-3 text-body2 leading-6 text-grey-7">
      같은 이메일로 확인할 계정이 여러 개 있거나<br>
      다른 소셜 로그인 계정이 연결되어 있어요.<br>
      기존 데이터를 보호하기 위해 자동으로 합치지 않았어요.
    </p>
    <p class="mt-6 text-caption1 text-grey-6">
      문의하기에서 가입 이메일과 사용한 로그인 방식을 알려주세요.
    </p>
    <button class="mt-10 h-14 w-full max-w-sm rounded-xl bg-grey-10 text-body2 font-semibold text-white" @click="navigateTo('/login', { replace: true })">
      로그인 화면으로 돌아가기
    </button>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
</script>
