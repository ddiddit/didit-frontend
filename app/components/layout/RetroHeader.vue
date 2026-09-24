<template>
    <div class="retro_header px-[20px] flex justify-between items-center h-[50px]">
        <button @click="onBack" :disabled="isBusy" :class="isBusy ? 'disabled:opacity-50' : ''">
            <img src="/icons/back.svg" alt="뒤로" class="w-5 h-5" />
        </button>
        <button class="text-[14px] text-grey-8 font-normal disabled:opacity-50" :disabled="finishDisabled" @click="onFinish">
            {{ title }}
        </button>
    </div>
</template>
<script setup lang="ts">
    // finishDisabled: 회고 마치기 버튼 잠금(응답 대기·처리 중). isBusy: 뒤로가기 버튼 잠금(초기 로딩 등)
    const props = defineProps<{ title: string, isBusy: boolean, onBack?: () => void, onFinish?: () => void, finishDisabled?: boolean }>()
</script>