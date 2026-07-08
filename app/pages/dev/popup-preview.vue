<template>
  <div class="h-full bg-background flex flex-col relative overflow-hidden">
    <!-- 더미 홈 콘텐츠 (딤·블러 효과 확인용 배경) -->
    <div class="flex-1 min-h-0 overflow-y-auto scrollbar-hide pb-24 pointer-events-none">
      <header class="flex items-center justify-end px-5 h-[50px]">
        <img src="/icons/bell-off.svg" alt="" class="w-6 h-6" />
      </header>
      <h1 class="px-5 text-title3 font-semibold text-grey-13 leading-[1.4]">
        디딧님,<br />오늘 어떤 일을 하셨나요?
      </h1>
      <div class="mt-5 mx-5 bg-white rounded-2xl p-[22px] flex flex-col gap-5">
        <div class="flex items-center gap-1.5">
          <span class="inline-flex items-center px-1.5 py-[3px] rounded-md text-[11px] font-semibold bg-tag-purple-light text-tag-purple">Lv.3</span>
          <span class="text-[18px] font-semibold text-grey-13">2주 연속 회고하기</span>
        </div>
        <p class="text-[14px] font-medium text-grey-8">매주 한 번씩 작성하면 달성할 수 있어요</p>
        <div class="h-4 rounded-full bg-grey-4" />
        <div class="w-full py-3 rounded-xl bg-primary text-center text-[16px] font-semibold text-grey-13">회고 남기기</div>
      </div>
      <div class="mt-8 px-5">
        <p class="text-[16px] font-semibold text-grey-10">최근 제안 받은 행동</p>
        <div class="mt-3.5 bg-white rounded-[18px] px-5 py-[22px] flex flex-col gap-[14px]">
          <p class="text-[15px] font-medium text-grey-13">온보딩 개선 효과를 데이터로 검증해보기</p>
          <div class="h-px bg-grey-3" />
          <p class="text-[15px] font-medium text-grey-13">핵심 가설을 사용자 인터뷰로 확인해보기</p>
        </div>
      </div>
    </div>

    <!-- 프리뷰 컨트롤 -->
    <div class="absolute top-2 left-1/2 -translate-x-1/2 z-[60] flex gap-2">
      <button class="px-3 py-1.5 rounded-lg bg-grey-13 text-grey-1 text-label2 font-semibold" @click="popup = 'levelup'">완료 팝업</button>
      <button class="px-3 py-1.5 rounded-lg bg-grey-13 text-grey-1 text-label2 font-semibold" @click="popup = 'failure'">실패 팝업</button>
      <button class="px-3 py-1.5 rounded-lg bg-grey-5 text-grey-13 text-label2 font-semibold" @click="popup = null">닫기</button>
    </div>

    <!-- 미션 완료(레벨업) 팝업 — home.vue와 동일한 오버레이 구성 -->
    <Teleport to="#app-container">
      <div v-if="popup === 'levelup'" class="absolute inset-0 z-[55] flex items-center justify-center px-5" style="padding-bottom: env(safe-area-inset-bottom, 0px)">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-[5px]" @click="popup = null" />
        <HomeMissionPopup
          :level="2"
          :message="'한 주 동안 꾸준히 회고를 작성했네요.\n작은 기록이 좋은 습관의 시작이 될 수 있어요.'"
          class="relative"
          @confirm="popup = null"
        />
      </div>
    </Teleport>

    <!-- 미션 실패 팝업 -->
    <Teleport to="#app-container">
      <div v-if="popup === 'failure'" class="absolute inset-0 z-[55] flex items-center justify-center px-5" style="padding-bottom: env(safe-area-inset-bottom, 0px)">
        <!-- 실패 팝업은 일반 딤 (진한 딤+블러는 획득/완료 팝업 전용) -->
        <div class="absolute inset-0 bg-black/40" @click="popup = null" />
        <HomeMissionFailurePopup
          message="기한 내에 미션을 완료하지 못했어요.
다시 도전해 보세요!"
          class="relative"
          @retry="popup = null"
        />
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
// 개발 전용 팝업 디자인 프리뷰 — 미션 완료/실패 팝업을 실제 컴포넌트로 확인
definePageMeta({ layout: false })

// 프로덕션에서는 접근 차단
if (!import.meta.dev) navigateTo('/home')

const popup = ref<'levelup' | 'failure' | null>('levelup')
</script>
