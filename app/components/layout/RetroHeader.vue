<template>
    <div class="retro_header px-[20px] flex justify-between items-center h-[50px]">
        <button @click="onBack" :disabled="isBusy" class="disabled:opacity-50">
            <img src="/icons/back.svg" alt="뒤로" class="w-5 h-5" />
        </button>
        <button class="text-[14px] text-grey-8 font-normal disabled:opacity-50" :disabled="isBusy">
            {{ title }}
        </button>
    </div>
</template>
<script setup lang="ts">
    const props = defineProps<{ title: string, isBusy: boolean, onBack?: () => void }>()
</script>