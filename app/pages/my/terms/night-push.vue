<template>
  <div class="h-full bg-white flex flex-col">

    <!-- 헤더 -->
    <div class="flex items-center px-5 h-[50px] shrink-0">
      <button class="p-1 -ml-1" @click="navigateTo('/my')">
        <img src="/icons/back.svg" alt="뒤로" class="w-6 h-6" />
      </button>
      <span class="flex-1 text-center text-body2 font-semibold text-grey-13">야간 푸시 알림 동의 안내</span>
      <div class="w-6 h-6" />
    </div>

    <!-- 본문 -->
    <div class="flex-1 overflow-y-auto px-5 py-6 space-y-5 text-label1 font-normal text-grey-9 leading-[1.6]">

      <h1 class="text-body2 font-bold text-grey-13">디딧(didit) 야간 마케팅 정보 수신 동의</h1>

      <p>본 동의서는 디딧(Didit)(이하 "서비스")이 야간 시간대에 마케팅 정보를 발송하기 위해 필요한 이용자의 사전 동의를 규정합니다. 본 동의는 선택 사항이며, 동의하지 않아도 서비스 이용에는 제한이 없습니다.</p>

      <section class="space-y-2">
        <h2 class="text-label1 font-semibold text-grey-13">제1조 (목적)</h2>
        <p>본 동의서는 회사가 야간 시간대(21:00 ~ 08:00)에 앱 푸시 알림 등을 통해 유익한 정보 및 마케팅 정보를 발송하기 위해 필요한 사항을 규정함을 목적으로 합니다.</p>
      </section>

      <section class="space-y-2">
        <h2 class="text-label1 font-semibold text-grey-13">제2조 (발송 정보의 종류)</h2>
        <p>회사는 다음과 같은 정보를 야간 시간대에 발송할 수 있습니다.</p>
        <ul class="space-y-1 pl-1">
          <li>・ 서비스 이벤트 및 프로모션 안내</li>
          <li>・ 신규 기능 또는 서비스 업데이트 안내</li>
          <li>・ 이용자 맞춤형 콘텐츠 추천</li>
          <li>・ 서비스 혜택 및 쿠폰 정보</li>
          <li>・ 회고 작성 리마인더 알림</li>
        </ul>
      </section>

      <section class="space-y-2">
        <h2 class="text-label1 font-semibold text-grey-13">제3조 (발송 방법)</h2>
        <p>회사는 다음과 같은 방법을 통해 야간 마케팅 정보를 발송할 수 있습니다.</p>
        <ul class="space-y-1 pl-1">
          <li>・ 앱 푸시 알림</li>
          <li>・ 인앱 알림</li>
        </ul>
      </section>

      <section class="space-y-2">
        <h2 class="text-label1 font-semibold text-grey-13">제4조 (동의 거부 사항의 안내)</h2>
        <p>이용자는 야간 마케팅 정보 수신 동의를 거부할 수 있으며, 동의를 거부해도 서비스 이용에는 제한이 없습니다.</p>
        <p>다만 야간 시간대에 제공되는 이벤트 및 혜택 안내 등의 정보는 수신할 수 없습니다.</p>
      </section>

    </div>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'default' })

const hideTabBar = useState('hideTabBar', () => false)
onMounted(() => { hideTabBar.value = true })
onUnmounted(() => { hideTabBar.value = false })
</script>
