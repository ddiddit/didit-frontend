<template>
  <div class="h-full bg-white flex flex-col">

    <!-- 헤더 -->
    <div class="flex items-center px-5 h-[50px] shrink-0">
      <button class="p-1 -ml-1" @click="navigateTo('/my')">
        <img src="/icons/back.svg" alt="뒤로" class="w-6 h-6" />
      </button>
      <span class="flex-1 text-center text-body2 font-semibold text-grey-13">개인정보 처리방침</span>
      <div class="w-6 h-6" />
    </div>

    <!-- 본문 -->
    <div class="flex-1 overflow-y-auto scrollbar-hide px-5 py-6 space-y-6 text-label1 font-normal text-grey-9 leading-[1.6]">

      <h1 class="text-heading1 font-bold text-grey-13">디딧(didit) 개인정보처리방침</h1>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">1. 총칙</h2>
        <p>디딧(Didit) 서비스(이하 "회사")는 이용자의 개인정보를 중요하게 생각하며 개인정보보호법 및 관련 법령을 준수합니다.</p>
        <p>본 개인정보처리방침은 회사가 제공하는 모바일 애플리케이션 및 관련 서비스(이하 "서비스") 이용 과정에서 수집하는 개인정보의 항목, 이용 목적, 보유 기간 및 보호 방법 등을 설명합니다.</p>
        <p>회사는 개인정보처리방침을 서비스 내에 공개하여 이용자가 언제든지 확인할 수 있도록 합니다.</p>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">2. 수집하는 개인정보 항목</h2>
        <p>회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집할 수 있습니다.</p>
        <p class="font-medium text-grey-10">① 회원가입 및 로그인 시</p>
        <p>서비스는 소셜 로그인 방식(Google, Apple)을 통해 회원가입이 이루어지며 다음 정보가 수집될 수 있습니다.</p>
        <ul class="space-y-1 pl-4">
          <li class="flex gap-[6px]"><span class="shrink-0 text-[16px] leading-none">•</span><span>소셜 로그인 고유 식별자(ID)</span></li>
          <li class="flex gap-[6px]"><span class="shrink-0 text-[16px] leading-none">•</span><span>닉네임</span></li>
          <li class="flex gap-[6px]"><span class="shrink-0 text-[16px] leading-none">•</span><span>이메일 주소 (제공 범위 내)</span></li>
          <li class="flex gap-[6px]"><span class="shrink-0 text-[16px] leading-none">•</span><span>프로필 이미지 (제공 범위 내)</span></li>
        </ul>
        <p>② 수집 항목은 이용자가 로그인 과정에서 동의한 범위에 따라 달라질 수 있습니다.</p>
        <p class="font-medium text-grey-10">③ 서비스 이용 과정에서 자동 수집되는 정보</p>
        <p>서비스 이용 과정에서 다음 정보가 자동으로 생성·수집될 수 있습니다.</p>
        <ul class="space-y-1 pl-4">
          <li class="flex gap-[6px]"><span class="shrink-0 text-[16px] leading-none">•</span><span>기기 정보 (OS, 기기 모델명 등)</span></li>
          <li class="flex gap-[6px]"><span class="shrink-0 text-[16px] leading-none">•</span><span>광고 식별자(ADID / IDFA 등)</span></li>
          <li class="flex gap-[6px]"><span class="shrink-0 text-[16px] leading-none">•</span><span>IP 주소</span></li>
        </ul>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">3. 개인정보의 이용 목적</h2>
        <p>수집한 개인정보는 다음 목적으로 이용됩니다.</p>
        <ul class="space-y-1 pl-4">
          <li class="flex gap-[6px]"><span class="shrink-0 text-[16px] leading-none">•</span><span>서비스 제공 및 회원 관리</span></li>
          <li class="flex gap-[6px]"><span class="shrink-0 text-[16px] leading-none">•</span><span>AI 기반 회고 기능 제공 및 개인화 서비스</span></li>
          <li class="flex gap-[6px]"><span class="shrink-0 text-[16px] leading-none">•</span><span>서비스 개선 및 신규 기능 개발</span></li>
          <li class="flex gap-[6px]"><span class="shrink-0 text-[16px] leading-none">•</span><span>공지사항 전달 및 고객 지원</span></li>
          <li class="flex gap-[6px]"><span class="shrink-0 text-[16px] leading-none">•</span><span>마케팅 및 광고 활용 (별도 동의 시)</span></li>
        </ul>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">4. 개인정보의 보유 및 이용 기간</h2>
        <p>회사는 이용자의 개인정보를 서비스 이용 기간 동안 보유합니다. 회원 탈퇴 시 개인정보는 즉시 삭제되나, 관련 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간 동안 보관됩니다.</p>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">5. 개인정보의 제3자 제공</h2>
        <p>회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 단, 법령에 의해 요구되는 경우는 예외로 합니다.</p>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">6. 개인정보 보호책임자</h2>
        <p>개인정보 관련 문의는 아래 담당자에게 연락하시기 바랍니다.</p>
        <ul class="space-y-1 pl-4">
          <li class="flex gap-[6px]"><span class="shrink-0 text-[16px] leading-none">•</span><span>담당자: didit 개발팀</span></li>
          <li class="flex gap-[6px]"><span class="shrink-0 text-[16px] leading-none">•</span><span>이메일: support@didit.ai.kr</span></li>
        </ul>
      </section>

    </div>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'default', hideTabBar: true })

</script>
