<template>
  <div class="h-full bg-white flex flex-col">

    <!-- 헤더 -->
    <div class="flex items-center px-5 h-[50px] shrink-0">
      <button class="p-1 -ml-1" @click="navigateTo('/my')">
        <img src="/icons/back.svg" alt="뒤로" class="w-6 h-6" />
      </button>
      <span class="flex-1 text-center text-body2 font-semibold text-grey-13">목표 달성 배지</span>
      <div class="w-6 h-6" />
    </div>

    <div class="flex-1 overflow-y-auto scrollbar-hide">
      <!-- 안내 배너 (radius 16, padding 24/18) -->
      <div class="px-5 pt-3 pb-4">
        <div class="rounded-2xl bg-grey-3 px-6 py-[18px] flex items-center justify-center">
          <span class="text-[14px] font-normal leading-[140%] tracking-[-0.02em] text-grey-13 text-center">나만의 회고 배지를 모아보세요!</span>
        </div>
      </div>

      <!-- 최근에 획득한 배지 (획득 배지가 있을 때만 구분선과 함께 표시) -->
      <template v-if="recentBadge">
        <div class="px-5 py-6 flex flex-col items-center gap-1">
          <img :src="recentBadge.image" :alt="recentBadge.name" class="h-[131px] object-contain" />
          <p class="text-[13px] font-medium leading-[140%] tracking-[-0.02em] text-grey-7">최근에 획득한 배지</p>
          <p class="text-[17px] font-semibold leading-[140%] tracking-[-0.02em] text-grey-13">{{ recentBadge.name }}</p>
        </div>
        <!-- 구분선 (px-5 인셋, #EEEEEE) -->
        <div class="mx-5 h-px bg-[#EEEEEE]" />
      </template>

      <!-- 배지 그리드 (2열, 가로간격 22 / 세로간격 34) -->
      <div class="px-5 pt-[30px] pb-10 grid grid-cols-2 gap-x-[22px] gap-y-[34px]">
        <button
          v-for="badge in badges"
          :key="badge.code"
          class="flex flex-col items-center"
          @click="openSheet(badge)"
        >
          <!-- 획득: 이미지 / 미획득: 잠금 박스(140×90) -->
          <div v-if="badge.acquired" class="w-full h-[120px] flex items-center justify-center">
            <img :src="badge.image" :alt="badge.name" class="max-h-[120px] max-w-full object-contain" />
          </div>
          <div v-else class="w-full h-[120px] flex items-center justify-center">
            <div class="w-[140px] h-[90px] rounded-[14px] border-[1.4px] border-dashed border-grey-6 flex items-center justify-center">
              <img src="/icons/lock.svg" alt="잠금" class="w-[21px] h-[21px]" />
            </div>
          </div>
          <p class="text-[14px] font-semibold leading-[140%] tracking-[-0.02em] text-grey-13 text-center">{{ badge.name }}</p>
          <p class="text-[13px] font-normal leading-[150%] tracking-[-0.02em] text-grey-8 text-center">{{ badge.description }}</p>
        </button>
      </div>
    </div>

    <!-- 배지 상세 바텀시트 (회고 기록 피커와 동일 컨테이너) -->
    <Teleport to="#app-container">
      <Transition name="sheet-fade">
        <div
          v-if="selected"
          class="absolute inset-0 z-20 bg-black/40"
          @click="selected = null"
        />
      </Transition>
      <Transition name="sheet-slide">
        <div
          v-if="selected"
          class="absolute left-5 right-5 z-30"
          style="bottom: 30px;"
          @click.stop
        >
          <div class="relative w-full h-[316px] bg-grey-1 rounded-[36px] overflow-hidden" style="padding: 32px 20px 20px;">
            <!-- 드래그 핸들 -->
            <div class="absolute top-[14px] left-1/2 -translate-x-1/2 w-[50px] h-1 rounded-full bg-grey-5" />
            <!-- 라벨 -->
            <p class="absolute top-[14px] left-5 text-[13px] font-medium text-grey-7">활동배지 선택</p>

            <div class="h-full flex flex-col items-center justify-center">
              <!-- 획득: 이미지 / 미획득: 잠금 박스 -->
              <div v-if="selected.acquired" class="h-[120px] flex items-center justify-center">
                <img :src="selected.image" :alt="selected.name" class="max-h-[120px] object-contain" />
              </div>
              <div v-else class="w-[180px] h-[110px] rounded-[14px] border-[1.4px] border-dashed border-grey-6 flex items-center justify-center">
                <img src="/icons/lock.svg" alt="잠금" class="w-7 h-7" />
              </div>

              <!-- 텍스트 영역 (간격 6) -->
              <div class="flex flex-col items-center gap-1.5 mt-6">
                <!-- 이름 + 진행 칩 (간격 8) -->
                <div class="flex items-center gap-2">
                  <p class="text-[17px] font-semibold leading-[140%] tracking-[-0.02em] text-grey-13">{{ selected.name }}</p>
                  <!-- 회고 개수 표기 (10회/30회 미획득 시) -->
                  <span
                    v-if="selected.countable && !selected.acquired"
                    class="flex items-center gap-px rounded-[5px] bg-grey-4 px-[5px] py-px"
                  >
                    <span class="text-[12px] font-semibold leading-[136%] tracking-[-0.02em] text-grey-12">{{ selected.current }}</span>
                    <span class="text-[12px] font-semibold leading-[136%] tracking-[-0.02em] text-grey-7">/{{ selected.goal }}</span>
                  </span>
                </div>
                <p class="text-[13px] font-normal leading-[150%] tracking-[-0.02em] text-grey-8">{{ selected.unlockText }}</p>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import type { BadgeView } from '~/composables/useBadges'

definePageMeta({ middleware: 'auth', layout: 'default', hideTabBar: true })

const { badges, recentBadge, load } = useBadges()

const selected = ref<BadgeView | null>(null)

function openSheet(badge: BadgeView) {
  selected.value = badge
}

onMounted(() => {
  load()
})
</script>

<style scoped>
.sheet-fade-enter-active { transition: opacity 0.25s ease; }
.sheet-fade-leave-active { transition: opacity 0.2s ease; }
.sheet-fade-enter-from,
.sheet-fade-leave-to    { opacity: 0; }

.sheet-slide-enter-active { transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s ease; }
.sheet-slide-leave-active { transition: transform 0.22s ease-in, opacity 0.22s ease; }
.sheet-slide-enter-from,
.sheet-slide-leave-to    { transform: translateY(120%); opacity: 0; }
</style>
