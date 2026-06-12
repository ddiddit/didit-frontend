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
    <div class="flex-1 overflow-y-auto px-5 py-6 space-y-5 text-label1 font-normal text-grey-9 leading-[1.6]">

      <h1 class="text-body2 font-bold text-grey-13">디딧(didit) 서비스 이용약관</h1>

      <section class="space-y-2">
        <h2 class="text-label1 font-semibold text-grey-13">제1조 (목적)</h2>
        <p>본 약관은 디딧(Didit) 서비스(이하 "서비스")를 제공하는 회사(이하 "회사")와 서비스를 이용하는 회원(이하 "이용자") 간의 권리, 의무 및 책임 사항 및 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
      </section>

      <section class="space-y-2">
        <h2 class="text-label1 font-semibold text-grey-13">제2조 (정의)</h2>
        <p>본 약관에서 사용하는 용어의 정의는 다음과 같습니다.</p>
        <ol class="space-y-1 pl-1 list-none">
          <li>1. "서비스"란 회사가 제공하는 AI 기반 회고 기능 및 이에 부수되는 기능, 웹사이트, 모바일 애플리케이션 등 디딧이 제공하는 모든 서비스를 의미합니다.</li>
          <li>2. "이용자"란 본 약관에 동의하고 Apple, Google 등 소셜 로그인 계정을 통해 서비스에 가입하여 서비스를 이용하는 자를 말합니다.</li>
          <li>3. "콘텐츠"란 이용자가 서비스를 이용하면서 작성, 기록 또는 저장하는 텍스트, 회고 내용, 정보 및 기타 데이터를 의미합니다.</li>
          <li>4. "AI 기능"이란 이용자가 입력한 정보에 기반하여 회사가 제공하는 자동 피드백, 추천, 분석 등 인공지능 기반 기능을 의미합니다.</li>
        </ol>
      </section>

      <section class="space-y-2">
        <h2 class="text-label1 font-semibold text-grey-13">제3조 (약관의 게시 및 변경)</h2>
        <ol class="space-y-1 pl-1 list-none">
          <li>1. 본 약관은 서비스 내 화면 또는 회사가 제공하는 방법을 통해 게시하며, 이용자가 약관에 동의함으로써 효력이 발생합니다.</li>
          <li>2. 회사는 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있습니다.</li>
          <li>3. 약관이 변경될 경우 회사는 변경 내용 및 적용일자를 사전에 공지합니다.</li>
          <li>4. 이용자가 변경된 약관에 동의하지 않을 경우 서비스 이용을 중단하고 회원 탈퇴를 할 수 있습니다.</li>
        </ol>
      </section>

      <section class="space-y-2">
        <h2 class="text-label1 font-semibold text-grey-13">제4조 (서비스의 제공 및 변경)</h2>
        <ol class="space-y-1 pl-1 list-none">
          <li>1. 회사는 이용자에게 AI 기반 회고 작성, 회고 기록 관리, 개인화 피드백 등의 서비스를 제공합니다.</li>
          <li>2. 회사는 서비스의 내용을 변경할 수 있으며, 변경 시 사전에 공지합니다.</li>
          <li>3. 회사는 서비스 운영상 또는 기술상 필요에 따라 서비스를 일시 중단할 수 있습니다.</li>
        </ol>
      </section>

      <section class="space-y-2">
        <h2 class="text-label1 font-semibold text-grey-13">제5조 (이용자의 의무)</h2>
        <ol class="space-y-1 pl-1 list-none">
          <li>1. 이용자는 관련 법령, 본 약관의 규정, 회사의 공지사항 등을 준수하여야 합니다.</li>
          <li>2. 이용자는 타인의 개인정보를 도용하거나 허위 정보를 입력해서는 안 됩니다.</li>
          <li>3. 이용자는 서비스를 이용하여 다음 행위를 해서는 안 됩니다.
            <ul class="pl-3 space-y-1 mt-1">
              <li>・ 타인의 권리를 침해하거나 명예를 훼손하는 행위</li>
              <li>・ 음란, 폭력적인 콘텐츠를 작성하거나 유포하는 행위</li>
              <li>・ 서비스의 정상적인 운영을 방해하는 행위</li>
            </ul>
          </li>
        </ol>
      </section>

      <section class="space-y-2">
        <h2 class="text-label1 font-semibold text-grey-13">제6조 (면책조항)</h2>
        <ol class="space-y-1 pl-1 list-none">
          <li>1. 회사는 천재지변, 전쟁 등 불가항력적인 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.</li>
          <li>2. AI 기능이 제공하는 피드백 및 추천은 참고용이며, 회사는 그 정확성에 대해 보장하지 않습니다.</li>
          <li>3. 이용자 간 또는 이용자와 제3자 사이에 발생한 분쟁에 대해 회사는 개입하지 않습니다.</li>
        </ol>
      </section>

      <section class="space-y-2">
        <h2 class="text-label1 font-semibold text-grey-13">제7조 (준거법 및 관할)</h2>
        <p>본 약관은 대한민국 법률에 따라 규율되며, 서비스 이용과 관련한 분쟁은 대한민국 법원을 관할 법원으로 합니다.</p>
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
