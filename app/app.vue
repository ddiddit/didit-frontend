<template>
  <!-- 태블릿(600px+)부터 바깥은 흰 배경 → 중앙 앱 패널이 액자처럼 보이도록. 네이티브는 항상 단일 패널 -->
  <div
    class="min-h-dvh bg-background"
    :class="!isNative && 'desktop:flex desktop:justify-center desktop:items-start'"
  >
    <NuxtRouteAnnouncer />

    <!-- 두 패널 묶음 -->
    <div class="flex min-h-dvh">

      <!-- 왼쪽 랜딩 패널 (웹 980px 이상 전용 — 네이티브 앱에선 노출 안 함) -->
      <aside
        v-if="!isNative"
        class="hidden desktop:flex flex-col justify-center
               w-[440px] flex-shrink-0 min-h-dvh
               border-r border-gray-100 py-10 pr-10 gap-10"
      >
        <div>
          <!-- 로고 -->
          <div class="flex items-center gap-2.5 mb-10">
            <img src="/side_logo.png" alt="didit" />
            <span class="text-[22px] font-bold text-gray-900 tracking-tight sr-only">didit</span>
          </div>

          <!-- 헤드라인 -->
          <h1 class="text-[28px] font-bold text-white leading-snug tracking-tight mb-3">
            오늘도 바빴는데 <br />
            <b class="font-bold text-primary">뭐가 남았는지</b> 모르겠다면
          </h1>

          <!-- 특징 -->
          <ul class="flex gap-3 mb-3">
            <li class="flex-1 p-6 bg-[#484848] box-border rounded-[16px]">
              <h2 class="text-[14px] tracking-tight leading-[1.4] text-grey-7">회고 전</h2>
              <span class="tracking-tight leading-[1.4] text-grey-7">오늘도 제대로 한게 없고 <br />실수한 것만 자꾸 생각나</span>
            </li>
            <li class="flex-1 p-6 bg-[#424E49] box-border rounded-[16px]">
              <h2 class="text-[14px] tracking-tight leading-[1.4] text-primary">회고 후</h2>
              <span class="tracking-tight leading-[1.4] text-white">내가 해낸 일도 있었네.<br />다음엔 이것부터 해보자!</span>
            </li>
          </ul>

          <div class="message px-6 py-5 rounded-[16px] bg-[url('/dot_bg.png')] bg-cover flex items-center gap-6">
            <img src="/didit.png" alt="didit_chc" />
            <p class="text-white tracking-tight leading-[1.4] text-[18px]">정리되지 않은 이야기도 괜찮아요<br />디딧과 함께 돌아봐요</p>
          </div>
        </div>

        <!-- QR 코드 -->
        <div class="rounded-2xl relative p-5 flex items-center gap-4 border border-grey-9">
          <img
            src="/qr-appstore.png"
            alt="App Store 다운로드 QR 코드"
            class="w-[40px] h-[40px] flex-shrink-0"
          />
          <a href="https://apps.apple.com/kr/app/디딧-didit-ai-업무-회고/id6761548843" >
            <span class="text-white">iOS 앱 설치하기</span>
          </a>
          <span class="absolute right-5 text-[12px] text-grey-7">Android 출시 예정</span>
        </div>
      </aside>

      <!-- 앱 영역: 폰=전체 너비, 태블릿(600px+)=500px 레터박스 중앙 정렬, 웹 데스크탑=390px 패널+그림자 -->
      <!-- 500px: UI가 390 기준 설계된 단일 컬럼 카드·채팅형이라 600은 카드가 퍼져 보임 -->
      <!-- overflow-clip: hidden과 달리 프로그래밍 스크롤도 불가 → 입력 포커스 시 scrollIntoView가 컨테이너를 밀어올려 헤더가 잘리는 문제 방지 -->
      <div
        id="app-container"
        class="w-full tablet:max-w-[500px] tablet:mx-auto h-dvh overflow-clip flex flex-col bg-white relative safe-top"
        :class="!isNative && 'desktop:max-w-none desktop:mx-0 desktop:w-[390px] desktop:flex-shrink-0'"
        :style="isTablet ? 'box-shadow: 0 2px 4px rgba(0,0,0,0.04), 0 8px 16px rgba(0,0,0,0.06), 0 24px 48px rgba(0,0,0,0.08);' : ''"
      >
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
        <UiToast />
        <UiBadgeAcquiredPopup />
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import UiToast from '~/components/ui/UiToast.vue'
import UiBadgeAcquiredPopup from '~/components/ui/UiBadgeAcquiredPopup.vue'
const { width } = useWindowSize()
// 600px 이상(태블릿·데스크탑)이면 앱 패널에 그림자를 줘 레터박스가 액자처럼 보이게 함
const isTablet = computed(() => width.value >= 600)

// 네이티브 앱에선 랜딩 패널·데스크탑 패널 레이아웃을 쓰지 않음 (항상 단일 앱 패널)
const { isNative } = useIsNative()

// 로그인 상태면 서버의 푸시 동의(enabled)를 보고 권한·토큰을 자동 동기화한다.
// (이미 동의한 사용자가 토글을 껐다 켜야만 권한 팝업이 뜨던 문제 해결)
onMounted(() => {
  if (!import.meta.client) return
  const push = usePushNotifications()
  // 알림 탭 딥링크는 로그인 여부와 무관하게 앱 시작 시 바로 바인딩 (종료 상태에서 탭해 실행된 경우 포함)
  push.bindNativeListeners()
  if (localStorage.getItem('accessToken')) push.syncIfConsented()
})

const features = [
  'AI 심화 질문으로 더 깊은 성찰',
  '프로젝트·태그로 체계적인 회고 관리',
  '스트릭·배지로 꾸준한 성장 확인',
]
</script>
