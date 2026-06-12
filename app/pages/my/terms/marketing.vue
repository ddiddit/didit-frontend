<template>
  <div class="h-full bg-white flex flex-col">

    <!-- 헤더 -->
    <div class="flex items-center px-5 h-[50px] shrink-0">
      <button class="p-1 -ml-1" @click="navigateTo('/my')">
        <img src="/icons/back.svg" alt="뒤로" class="w-6 h-6" />
      </button>
      <span class="flex-1 text-center text-body2 font-semibold text-grey-13">마케팅 정보 수신 동의</span>
      <div class="w-6 h-6" />
    </div>

    <!-- 본문 -->
    <div class="flex-1 overflow-y-auto scrollbar-hide px-5 py-6 space-y-6 text-label1 font-normal text-grey-9 leading-[1.6]">

      <h1 class="text-heading1 font-bold text-grey-13">디딧(didit) 마케팅 정보 수신 동의</h1>

      <p>본 동의서는 디딧(Didit) 서비스(이하 "회사")가 제공하는 이벤트, 혜택, 서비스 소식 등 마케팅 정보 수신에 대한 이용자의 내용을 규정합니다.</p>
      <p>본 동의는 선택 사항이며, 이용자는 동의하지 않아도 서비스 이용에는 제한이 없습니다.</p>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">제1조 (목적)</h2>
        <p>본 동의서는 회사가 이메일, 앱 푸시 알림, 인앱 알림 등을 통해 서비스 관련 마케팅 정보를 발송하기 위해 필요한 사항과 이용자의 권리를 규정함을 목적으로 합니다.</p>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">제2조 (수집 및 활용 항목)</h2>
        <p>회사는 다음과 같은 정보를 활용하여 마케팅 정보를 발송할 수 있습니다.</p>
        <ul class="space-y-1 pl-4">
          <li class="flex gap-[6px]"><span class="shrink-0 text-[16px] leading-none">•</span><span>닉네임</span></li>
          <li class="flex gap-[6px]"><span class="shrink-0 text-[16px] leading-none">•</span><span>이메일 주소</span></li>
          <li class="flex gap-[6px]"><span class="shrink-0 text-[16px] leading-none">•</span><span>서비스 이용 기록 및 서비스 이용 데이터</span></li>
        </ul>
        <p>해당 정보는 개인 맞춤형 콘텐츠 추천 및 서비스 안내를 위해 활용될 수 있습니다.</p>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">제3조 (마케팅 활용 목적)</h2>
        <p>회사는 이용자의 정보를 다음 목적을 위해 활용합니다.</p>
        <ul class="space-y-1 pl-4">
          <li class="flex gap-[6px]"><span class="shrink-0 text-[16px] leading-none">•</span><span>신규 기능 또는 서비스 공지 안내</span></li>
          <li class="flex gap-[6px]"><span class="shrink-0 text-[16px] leading-none">•</span><span>디딧 서비스 업데이트 및 주요 공지 안내</span></li>
          <li class="flex gap-[6px]"><span class="shrink-0 text-[16px] leading-none">•</span><span>서비스 관련 이벤트, 프로모션 및 혜택 제공</span></li>
          <li class="flex gap-[6px]"><span class="shrink-0 text-[16px] leading-none">•</span><span>이용자 관심 기반 콘텐츠 추천 및 정보 제공</span></li>
          <li class="flex gap-[6px]"><span class="shrink-0 text-[16px] leading-none">•</span><span>개인 맞춤형 서비스 안내 및 광고 정보 제공</span></li>
        </ul>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">제4조 (동의 거부 사항의 안내)</h2>
        <p>이용자는 마케팅 정보 수신 동의를 거부할 수 있으며, 동의를 거부해도 서비스 이용에는 제한이 없습니다.</p>
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
