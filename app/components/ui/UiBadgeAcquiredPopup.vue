<template>
  <Teleport to="#app-container">
    <Transition name="badge-popup">
      <div
        v-if="badge"
        class="absolute inset-0 z-50 flex items-center justify-center bg-black/40"
        @click="hide"
      >
        <div
          class="w-[300px] bg-grey-1 rounded-2xl flex flex-col items-center"
          style="padding: 30px 20px 36px;"
          @click.stop
        >
          <!-- 배지 이미지 -->
          <img
            :src="badge.image"
            :alt="badge.name"
            class="w-[164px] h-[120px] object-contain"
          />

          <!-- 텍스트 영역 -->
          <div class="flex flex-col items-center gap-2 mt-[14px] w-full">
            <p class="text-[17px] font-semibold leading-[140%] tracking-[-0.02em] text-grey-13 text-center">
              🎉 {{ badge.name }} 획득!
            </p>
            <p
              class="text-[14px] font-normal leading-[160%] tracking-[-0.02em] text-grey-8 text-center whitespace-pre-line"
            >{{ badge.congratsText }}</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const { badge, hide } = useBadgeAcquired()
</script>

<style scoped>
.badge-popup-enter-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.badge-popup-leave-active { transition: opacity 0.2s ease, transform 0.15s ease; }
.badge-popup-enter-from  { opacity: 0; transform: scale(0.92); }
.badge-popup-leave-to    { opacity: 0; transform: scale(0.92); }
</style>
