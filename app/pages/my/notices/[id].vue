<template>
  <div class="h-full bg-white flex flex-col">

    <!-- 닫기 헤더 -->
    <div class="h-[50px] px-5 flex items-center justify-end shrink-0">
      <button class="p-1 -mr-1" @click="navigateTo('/my/notices')">
        <img src="/icons/close.svg" alt="닫기" class="w-6 h-6" />
      </button>
    </div>

    <!-- 본문 -->
    <div v-if="notice" class="flex-1 overflow-y-auto px-5 pt-4 pb-10">
      <!-- 날짜 + 제목 -->
      <div class="flex flex-col gap-2 mb-5">
        <p class="text-caption1 font-normal text-grey-7">{{ notice.date }}</p>
        <h1 class="text-heading2 font-semibold text-grey-13">{{ notice.title }}</h1>
      </div>

      <!-- 구분선 -->
      <div class="h-px bg-grey-5 mb-5" />

      <!-- 내용 -->
      <p class="text-body3-reading font-normal text-grey-10">{{ notice.body }}</p>
    </div>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'default', hideTabBar: true })


const route = useRoute()

const notices = [
  { id: '1', title: '최신 업데이트와 서비스 운영 관련 안내사항', date: '2026.03.05', body: '디딧의 최신 업데이트와 서비스 운영 관련 안내사항을 확인하실 수 있습니다. 회고 저장, 기록 확인, AI 피드백 기능이 보다 안정적으로 동작하도록 개선했습니다. 일부 업데이트는 순차적으로 적용되어 사용자별 반영 시점이 다를 수 있습니다. 앞으로도 더 나은 회고 경험을 제공할 수 있도록 서비스를 지속적으로 개선해나가겠습니다.' },
  { id: '2', title: '디딧 운영 안내사항', date: '2026.02.10', body: '디딧 서비스 운영과 관련된 안내사항입니다. 원활한 서비스 이용을 위해 정기 점검 일정 및 운영 정책 변경 사항을 공지드립니다. 이용에 불편을 드려 죄송하며, 보다 나은 서비스를 제공하기 위해 최선을 다하겠습니다.' },
  { id: '3', title: '기능 개선 및 적용 안내', date: '2026.01.20', body: '이번 업데이트를 통해 회고 작성 플로우가 개선되었습니다. AI 심화 질문 기능이 더욱 자연스럽게 동작하며, 프로젝트 및 태그 관리 기능도 편의성이 향상되었습니다. 앞으로도 지속적인 기능 개선을 통해 더 나은 서비스를 제공하겠습니다.' },
]

const notice = computed(() => notices.find(n => n.id === route.params.id))
</script>
