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
    <div class="flex-1 overflow-y-auto scrollbar-hide px-5 pt-6 pb-10 space-y-6 text-label1 font-normal text-grey-10 leading-[1.6]">

      <h1 class="text-heading1 font-semibold text-grey-13">디딧(didit) 개인정보처리방침</h1>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">1. 총칙</h2>
        <p>디딧(Didit) 서비스(이하 "회사")는 이용자의 개인정보를 중요하게 생각하며「개인정보 보호법」등 관련 법령을 준수합니다.</p>
        <p>본 개인정보처리방침은 회사가 제공하는 모바일 애플리케이션 및 관련 서비스(이하 "서비스") 이용 과정에서 수집되는 개인정보의 항목, 이용 목적, 보유 기간 및 보호 방법 등을 설명합니다.</p>
        <p>회사는 개인정보처리방침을 서비스 내에 공개하여 이용자가 언제든지 확인할 수 있도록 합니다.</p>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">2. 수집하는 개인정보 항목</h2>
        <p>회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집할 수 있습니다.</p>
        <div class="flex flex-col gap-4 mt-1">
          <div class="flex flex-col gap-1">
            <p class="font-medium text-grey-13">① 회원가입 및 로그인 시</p>
            <p>서비스는 소셜 로그인 방식(Google, Apple)을 통해 회원가입이 이루어지며 다음 정보가 수집될 수 있습니다.</p>
            <p class="pl-3">• 소셜 로그인 고유 식별자(ID)</p>
            <p class="pl-3">• 닉네임</p>
            <p class="pl-3">• 이메일 주소 (제공 범위 내)</p>
            <p class="pl-3">• 프로필 이미지 (제공 범위 내)</p>
            <p>※ 수집 항목은 이용자가 로그인 과정에서 동의한 범위에 따라 달라질 수 있습니다.</p>
          </div>
          <div class="flex flex-col gap-1">
            <p class="font-medium text-grey-13">② 서비스 이용 과정에서 자동 수집되는 정보</p>
            <p>서비스 이용 과정에서 다음 정보가 자동으로 생성·수집될 수 있습니다.</p>
            <p class="pl-3">• 기기 정보 (OS, 기기 모델명 등)</p>
            <p class="pl-3">• 광고 식별자(ADID / IDFA 등)</p>
            <p class="pl-3">• IP 주소</p>
            <p class="pl-3">• 접속 로그</p>
            <p class="pl-3">• 서비스 이용 기록</p>
            <p class="pl-3">• 앱 사용 기록</p>
          </div>
          <div class="flex flex-col gap-1">
            <p class="font-medium text-grey-13">③ 서비스 이용 시 생성되는 정보</p>
            <p>이용자가 서비스를 이용하면서 다음 정보가 생성될 수 있습니다.</p>
            <p class="pl-3">• 서비스 내 작성한 텍스트 콘텐츠</p>
            <p class="pl-3">• 이용자가 입력한 기록 또는 리뷰 정보</p>
          </div>
        </div>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">3. 개인정보 수집 및 이용 목적</h2>
        <p>회사는 다음 목적을 위해 개인정보를 이용합니다.</p>
        <p class="pl-3">• 회원 식별 및 로그인 인증</p>
        <p class="pl-3">• 서비스 이용 기록 관리</p>
        <p class="pl-3">• 이용자가 작성한 콘텐츠 관리</p>
        <p class="pl-3">• 서비스 기능 제공 및 운영</p>
        <p class="pl-3">• 서비스 품질 개선 및 통계 분석</p>
        <p class="pl-3">• 부정 이용 방지 및 서비스 보안 유지</p>
        <p class="pl-3">• 고객 문의 대응 및 공지사항 전달</p>
        <p class="pl-3">• 법령 준수 및 필요한 경우 이용자 고지</p>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">4. 개인정보의 제3자 제공</h2>
        <p>회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.</p>
        <p>다만 다음의 경우 예외적으로 제공될 수 있습니다.</p>
        <p class="pl-3">• 이용자가 사전에 동의한 경우</p>
        <p class="pl-3">• 법령에 따라 제공이 요구되는 경우</p>
        <p class="pl-3">• 통계 작성 및 연구 목적을 위해 개인을 식별할 수 없는 형태로 가공하여 제공하는 경우</p>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">5. 개인정보의 보유 및 이용기간</h2>
        <p>회사는 개인정보 수집 및 이용 목적이 달성된 후 지체 없이 해당 정보를 파기합니다.</p>
        <p>다만 관련 법령에 따라 일정 기간 보관이 필요한 경우 다음과 같이 보관합니다.</p>
        <!-- 보관기간 표 -->
        <div class="border border-[#E6E6E6]">
          <div class="flex">
            <div class="flex-1 px-2 py-1 bg-[#F6F6F6] border-r border-b border-[#E6E6E6]">
              <p class="text-[13px] font-medium leading-[140%] tracking-[-0.02em] text-grey-8">항목</p>
            </div>
            <div class="flex-1 px-2 py-1 bg-[#F6F6F6] border-b border-[#E6E6E6]">
              <p class="text-[13px] font-medium leading-[140%] tracking-[-0.02em] text-grey-8">보관기간</p>
            </div>
          </div>
          <div class="flex">
            <div class="flex-1 px-2 py-1 border-r border-b border-[#E6E6E6]">
              <p class="text-[13px] font-medium leading-[140%] tracking-[-0.02em] text-grey-8">회원정보</p>
            </div>
            <div class="flex-1 px-2 py-1 border-b border-[#E6E6E6]">
              <p class="text-[13px] font-medium leading-[140%] tracking-[-0.02em] text-grey-8">회원 탈퇴 후 30일</p>
            </div>
          </div>
          <div class="flex">
            <div class="flex-1 px-2 py-1 border-r border-b border-[#E6E6E6]">
              <p class="text-[13px] font-medium leading-[140%] tracking-[-0.02em] text-grey-8">서비스 이용 기록</p>
            </div>
            <div class="flex-1 px-2 py-1 border-b border-[#E6E6E6]">
              <p class="text-[13px] font-medium leading-[140%] tracking-[-0.02em] text-grey-8">3개월</p>
            </div>
          </div>
          <div class="flex">
            <div class="flex-1 px-2 py-1 border-r border-[#E6E6E6]">
              <p class="text-[13px] font-medium leading-[140%] tracking-[-0.02em] text-grey-8">접속 로그 및 IP 정보</p>
            </div>
            <div class="flex-1 px-2 py-1">
              <p class="text-[13px] font-medium leading-[140%] tracking-[-0.02em] text-grey-8">3개월</p>
            </div>
          </div>
        </div>
        <p>보관 기간이 경과하면 해당 정보는 안전하게 파기됩니다.</p>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">6. 개인정보 파기 절차 및 방법</h2>
        <p>회사는 개인정보 보유 기간이 경과하거나 처리 목적이 달성된 경우 지체 없이 개인정보를 파기합니다.</p>
        <p class="font-medium text-grey-13">파기 방법</p>
        <p class="pl-3">• 전자 파일 형태: 복구가 불가능한 기술적 방법으로 삭제</p>
        <p class="pl-3">• 종이 문서 형태: 분쇄 또는 소각</p>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">7. 이용자의 권리</h2>
        <p>이용자는 언제든지 자신의 개인정보에 대해 다음 권리를 행사할 수 있습니다.</p>
        <p class="pl-3">• 개인정보 열람 요청</p>
        <p class="pl-3">• 개인정보 수정 및 정정 요청</p>
        <p class="pl-3">• 개인정보 삭제 요청</p>
        <p class="pl-3">• 회원 탈퇴 요청</p>
        <p>위 요청은 서비스 내 설정 메뉴 또는 고객센터를 통해 신청할 수 있습니다.</p>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">8. 개인정보의 안전성 확보 조치</h2>
        <p>회사는 개인정보 보호를 위해 다음과 같은 보안 조치를 시행하고 있습니다.</p>
        <p class="pl-3">• 개인정보 암호화 저장</p>
        <p class="pl-3">• 접근 권한 관리 및 내부 접근 통제</p>
        <p class="pl-3">• 개인정보 최소 수집 원칙 적용</p>
        <p class="pl-3">• 정기적인 보안 점검 및 시스템 관리</p>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">9. 개인정보 보호책임자</h2>
        <p>회사는 개인정보 보호 관련 문의 및 처리를 위해 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
        <p class="font-medium text-grey-13">개인정보 보호 담당자</p>
        <p>담당자: didit 개발팀</p>
        <p>이메일: support@didit.ai.kr</p>
        <p>이용자는 개인정보 보호와 관련한 문의, 불만 처리, 피해 구제 등을 위 담당자에게 문의할 수 있습니다.</p>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">10. 개인정보처리방침 변경</h2>
        <p>본 개인정보처리방침의 내용 추가, 삭제 및 수정이 있을 경우 서비스 내 공지사항 또는 팝업 등을 통해 사전에 안내합니다.</p>
        <p>다만 다음과 같은 중요한 변경 사항이 있는 경우 최소 30일 전에 공지합니다.</p>
        <p class="pl-3">• 수집하는 개인정보 항목 변경</p>
        <p class="pl-3">• 개인정보 이용 목적 변경</p>
        <p class="pl-3">• 개인정보 보관 기간 변경</p>
        <p>필요한 경우 이용자의 별도 동의를 다시 받을 수 있습니다.</p>
      </section>

    </div>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'default', hideTabBar: true })
</script>
