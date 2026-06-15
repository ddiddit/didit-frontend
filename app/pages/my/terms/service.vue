<template>
  <div class="h-full bg-white flex flex-col">

    <!-- 헤더 -->
    <div class="flex items-center px-5 h-[50px] shrink-0">
      <button class="p-1 -ml-1" @click="navigateTo('/my')">
        <img src="/icons/back.svg" alt="뒤로" class="w-6 h-6" />
      </button>
      <span class="flex-1 text-center text-body2 font-semibold text-grey-13">서비스 이용약관</span>
      <div class="w-6 h-6" />
    </div>

    <!-- 본문 -->
    <div class="flex-1 overflow-y-auto scrollbar-hide px-5 pt-6 pb-10 space-y-6 text-label1 font-normal text-grey-10 leading-[1.6]">

      <h1 class="text-heading1 font-semibold text-grey-13">디딧(didit) 서비스 이용약관</h1>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">제1조 (목적)</h2>
        <p>본 약관은 디딧(Didit) 서비스(이하 "서비스")를 제공하는 회사(이하 "회사")와 서비스를 이용하는 회원(이하 "이용자") 간의 권리, 의무 및 책임 사항 및 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">제2조 (정의)</h2>
        <p>본 약관에서 사용하는 용어의 정의는 다음과 같습니다.</p>
        <p>"서비스"란 회사가 제공하는 AI 기반 회고 기능 및 이에 부수되는 기능, 웹사이트, 모바일 애플리케이션 등 디딧이 제공하는 모든 서비스를 의미합니다.</p>
        <p>"이용자"란 본 약관에 동의하고 Apple, Google 등 소셜 로그인 계정을 통해 서비스에 가입하여 서비스를 이용하는 자를 말합니다.</p>
        <p>"콘텐츠"란 이용자가 서비스를 이용하면서 작성, 기록 또는 저장하는 텍스트, 회고 내용, 정보 및 기타 데이터를 의미합니다.</p>
        <p>"AI 기능"이란 이용자가 입력한 정보에 기반하여 회사가 제공하는 자동 피드백, 추천, 분석 등 인공지능 기반 기능을 의미합니다.</p>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">제3조 (약관의 게시 및 변경)</h2>
        <div class="flex flex-col gap-3">
          <p>1. 본 약관은 서비스 내 화면 또는 회사가 제공하는 방법을 통해 게시되며, 이용자가 약관에 동의함으로써 효력이 발생합니다.</p>
          <p>2. 회사는 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있습니다.</p>
          <p>3. 약관이 변경될 경우 회사는 변경 내용 및 적용일자를 사전에 공지합니다.</p>
          <p>4. 이용자가 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단하고 회원 탈퇴를 할 수 있습니다.</p>
        </div>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">제4조 (회원가입 및 계정 관리)</h2>
        <div class="flex flex-col gap-3">
          <p>1. 서비스 이용은 Apple, Google 등 소셜 로그인 방식을 통해 회원가입을 완료한 후 가능합니다.</p>
          <p>2. 이용자는 정확하고 최신의 정보를 제공해야 하며, 허위 정보 제공으로 발생하는 불이익에 대한 책임은 이용자에게 있습니다.</p>
          <p>3. 이용자는 본인의 계정 정보를 안전하게 관리해야 하며 타인에게 양도, 대여 또는 공유할 수 없습니다.</p>
          <p>4. 계정 관리 소홀로 인해 발생한 문제에 대해 회사는 책임을 지지 않습니다.</p>
        </div>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">제5조 (서비스의 제공)</h2>
        <p>회사는 다음과 같은 서비스를 제공합니다.</p>
        <p class="pl-3">• AI 기반 회고 질문 제공</p>
        <p class="pl-3">• 회고 기록 작성 및 저장 기능</p>
        <p class="pl-3">• AI 기반 회고 분석 및 피드백 제공</p>
        <p class="pl-3">• 회고 기록 관리 및 조회 기능</p>
        <p class="pl-3">• 기타 회사가 정하는 서비스</p>
        <p>회사는 서비스 품질 향상을 위해 서비스의 기능을 추가, 변경 또는 삭제할 수 있습니다.</p>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">제6조 (서비스 이용 제한)</h2>
        <p>회사는 다음과 같은 경우 이용자의 서비스 이용을 제한하거나 계정을 정지할 수 있습니다.</p>
        <div class="flex flex-col gap-3">
          <p>1. 타인의 정보를 도용하여 계정을 생성한 경우</p>
          <p>2. 불법적인 콘텐츠를 게시하거나 유포한 경우</p>
          <p>3. 타인 또는 특정 대상에 대한 명예훼손, 비방, 욕설 등 부적절한 행위를 한 경우</p>
          <p>4. 서비스 시스템을 해킹하거나 비정상적인 접근을 시도한 경우</p>
          <p>5. 서비스 운영을 고의적으로 방해하는 경우</p>
          <p>6. 기타 관련 법령 또는 본 약관을 위반한 경우</p>
        </div>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">제7조 (회원의 의무)</h2>
        <p>이용자는 다음 사항을 준수해야 합니다.</p>
        <div class="flex flex-col gap-3">
          <p>1. 관련 법령, 본 약관 및 회사의 공지사항을 준수해야 합니다.</p>
          <p>2. 허위 정보 또는 타인을 오도하는 정보를 게시해서는 안 됩니다.</p>
          <p>3. 상업적 홍보 또는 광고 목적의 콘텐츠를 무단으로 등록할 수 없습니다.</p>
          <p>4. 다른 이용자의 개인정보를 무단으로 수집·저장·공개해서는 안 됩니다.</p>
        </div>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">제8조 (콘텐츠의 저작권 및 이용권)</h2>
        <p>이용자가 서비스 내에 작성한 콘텐츠의 저작권은 해당 이용자에게 있습니다.</p>
        <p>이용자는 회사가 다음 목적을 위해 콘텐츠를 사용할 수 있음에 동의합니다.</p>
        <p class="pl-3">• 서비스 운영 및 기능 제공</p>
        <p class="pl-3">• 서비스 개선 및 사용자 경험 향상</p>
        <p class="pl-3">• 서비스 홍보 및 마케팅 목적 활용</p>
        <p class="pl-3">• 검색 및 추천 기능 구현</p>
        <p>회사는 이용자의 동의 없이 콘텐츠를 제3자에게 판매하지 않습니다.</p>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">제9조 (AI 기능 이용)</h2>
        <div class="flex flex-col gap-3">
          <p>1. 회사는 서비스 내에서 AI 기반 분석, 피드백 또는 추천 기능을 제공할 수 있습니다.</p>
          <p>2. AI 기능은 참고용 정보이며 회사는 해당 결과의 정확성, 완전성 또는 특정 목적 적합성을 보장하지 않습니다.</p>
          <p>3. 이용자는 AI 기능을 이용함에 있어 제공되는 결과를 개인의 판단과 책임 하에 활용해야 합니다.</p>
        </div>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">제10조 (알림 서비스)</h2>
        <div class="flex flex-col gap-3">
          <p>1. 회사는 서비스 운영, 업데이트, 공지사항 안내 등을 위해 푸시 알림을 제공할 수 있습니다.</p>
          <p>2. 이용자는 서비스 설정 메뉴를 통해 알림 수신 여부를 변경할 수 있습니다.</p>
          <p>3. 마케팅 정보 또는 광고성 알림의 경우 이용자의 별도 동의를 받은 경우에만 발송됩니다.</p>
        </div>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">제11조 (개인정보 보호)</h2>
        <div class="flex flex-col gap-3">
          <p>1. 회사는 이용자의 개인정보를 관련 법령 및 회사의 개인정보처리방침에 따라 보호합니다.</p>
          <p>2. 개인정보 처리에 관한 자세한 사항은 서비스 내에 게시된 개인정보처리방침을 따릅니다.</p>
        </div>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">제12조 (서비스 중단)</h2>
        <div class="flex flex-col gap-3">
          <p>1. 회사는 다음의 경우 서비스 제공을 일시적으로 중단할 수 있습니다.</p>
          <div class="flex flex-col gap-1 pl-3">
            <p>a. 시스템 점검 및 유지보수</p>
            <p>b. 서버 장애 또는 통신 장애</p>
            <p>c. 천재지변 등 불가항력적 상황</p>
          </div>
          <p>2. 서비스 중단이 발생할 경우 회사는 가능한 범위 내에서 사전에 공지합니다.</p>
        </div>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">제13조 (회원 탈퇴 및 계약 해지)</h2>
        <div class="flex flex-col gap-3">
          <p>1. 이용자는 언제든지 서비스 내 회원 탈퇴 기능을 통해 탈퇴할 수 있습니다.</p>
          <p>2. 탈퇴 시 이용자의 개인정보는 관련 법령 및 개인정보처리방침에 따라 처리됩니다.</p>
          <p>3. 이용자가 작성한 콘텐츠는 서비스 운영 정책에 따라 삭제 또는 비식별 처리될 수 있습니다.</p>
          <p>4. 회사는 약관 위반 등 부정 이용이 확인된 경우 사전 통보 후 계정을 해지할 수 있습니다.</p>
        </div>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">제14조 (책임 제한)</h2>
        <p>회사는 다음 사항에 대해 책임을 지지 않습니다.</p>
        <div class="flex flex-col gap-3">
          <p>1. 이용자가 서비스에 게시한 콘텐츠의 정확성</p>
          <p>2. 이용자 간 발생한 분쟁</p>
          <p>3. 서비스 장애로 인한 데이터 손실</p>
          <p>4. 이용자의 위법 행위로 인해 발생한 손해</p>
        </div>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-label1 font-semibold text-grey-13">제15조 (준거법 및 분쟁 해결)</h2>
        <div class="flex flex-col gap-3">
          <p>1. 본 약관은 대한민국 법률에 따라 해석되고 적용됩니다.</p>
          <p>2. 회사와 이용자 간 분쟁이 발생한 경우 당사자는 성실히 협의하여 해결하도록 노력합니다.</p>
          <p>3. 협의로 해결되지 않을 경우 관할 법원은 대한민국 민사소송법에 따릅니다.</p>
        </div>
      </section>

    </div>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'default', hideTabBar: true })
</script>
