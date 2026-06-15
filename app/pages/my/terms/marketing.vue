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
    <div class="flex-1 overflow-y-auto scrollbar-hide px-5 pt-6 pb-10 space-y-6 text-label1 font-normal text-grey-10 leading-[1.6]">

      <h1 class="text-heading1 font-semibold text-grey-13">디딧(didit) 마케팅 정보 수신 동의</h1>

      <div class="flex flex-col gap-1">
        <p>본 동의서는 디딧(Didit) 서비스(이하 "회사")가 제공하는 이벤트, 혜택, 서비스 안내 등 마케팅 정보 수신에 대한 이용자의 동의 내용을 규정합니다.</p>
        <p>본 동의는 선택 사항이며, 이용자는 동의하지 않아도 서비스 이용에는 제한이 없습니다.</p>
      </div>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">제1조 (목적)</h2>
        <p>본 동의서는 회사가 이메일, 앱 푸시 알림, 인앱 알림 등을 통해 서비스 관련 마케팅 정보를 발송하기 위해 필요한 사항과 이용자의 권리를 규정함을 목적으로 합니다.</p>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">제2조 (수집 및 활용 항목)</h2>
        <p>회사는 다음과 같은 정보를 활용하여 마케팅 정보를 발송할 수 있습니다.</p>
        <p class="pl-3">• 닉네임</p>
        <p class="pl-3">• 이메일 주소</p>
        <p class="pl-3">• 서비스 이용 기록 및 서비스 이용 데이터</p>
        <p>해당 정보는 개인 맞춤형 콘텐츠 추천 및 서비스 안내를 위해 활용될 수 있습니다.</p>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">제3조 (마케팅 활용 목적)</h2>
        <p>회사는 이용자의 정보를 다음 목적을 위해 활용할 수 있습니다.</p>
        <p class="pl-3">• 신규 기능 또는 서비스 출시 안내</p>
        <p class="pl-3">• 디딧 서비스 업데이트 및 주요 공지 안내</p>
        <p class="pl-3">• 서비스 관련 이벤트, 프로모션 및 혜택 제공</p>
        <p class="pl-3">• 이용자 관심 기반 콘텐츠 추천 정보 제공</p>
        <p class="pl-3">• 개인 맞춤형 서비스 안내 및 광고 정보 제공</p>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">제4조 (전송 방법)</h2>
        <p>회사는 다음과 같은 방법을 통해 마케팅 정보를 발송할 수 있습니다.</p>
        <p class="pl-3">• 이메일</p>
        <p class="pl-3">• 앱 푸시 알림</p>
        <p class="pl-3">• 인앱 알림(공지사항 또는 메시지 안내)</p>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">제5조 (동의 거부 시 불이익 안내)</h2>
        <p>이용자는 마케팅 정보 수신 동의를 거부할 수 있습니다.</p>
        <p>마케팅 수신 동의를 거부하더라도 서비스의 기본적인 이용에는 제한이 없습니다.</p>
        <p>(다만 이벤트, 혜택, 프로모션 등 일부 정보 제공이 제한될 수 있습니다.)</p>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">제6조 (동의 철회)</h2>
        <p>이용자는 언제든지 아래 방법을 통해 마케팅 정보 수신 동의를 철회할 수 있습니다.</p>
        <p class="pl-3">• 앱 내 설정 메뉴에서 마케팅 알림 수신 해제</p>
        <p class="pl-3">• 이메일 내 수신 거부 기능 이용</p>
        <p class="pl-3">• 고객센터 문의</p>
        <p>동의 철회 시 해당 설정은 즉시 반영됩니다.</p>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">제7조 (개인정보 보유 기간)</h2>
        <p>마케팅 정보 발송을 위해 활용되는 개인정보는 이용자가 마케팅 수신 동의를 철회하거나 회원 탈퇴 시 즉시 파기합니다.</p>
        <p>단, 관련 법령에 따라 보관이 필요한 경우 해당 법령 기준에 따릅니다.</p>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">제8조 (개정 고지)</h2>
        <p>본 동의 내용이 변경될 경우 회사는 변경 사항을 서비스 내 공지 또는 팝업 등을 통해 사전에 안내합니다.</p>
      </section>

    </div>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'default', hideTabBar: true })
</script>
