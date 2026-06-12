<template>
  <div class="h-full bg-background flex flex-col">

    <!-- 헤더 -->
    <div class="relative flex items-center justify-center px-5 h-[50px] shrink-0">
      <button class="absolute left-5" @click="router.back()">
        <img src="/icons/back.svg" alt="뒤로" class="w-6 h-6" />
      </button>
      <span class="text-body2 font-semibold text-grey-13">프로젝트 편집</span>
    </div>

    <!-- 빈 상태 -->
    <div
      v-if="!isLoading && projects.length === 0"
      class="flex-1 flex flex-col items-center justify-center gap-[6px]"
    >
      <img src="/icons/empty-projects.svg" alt="" class="w-[70px] h-[70px] mb-[6px]" />
      <p class="text-heading2 font-semibold text-grey-13">아직 프로젝트가 없어요</p>
      <p class="text-label1-reading font-normal text-grey-9 text-center">
        새 프로젝트를 만들어<br />회고를 정리해 보세요!
      </p>
      <button
        class="flex items-center gap-1 mt-[34px] pl-[12px] pr-[18px] py-[9px] bg-primary rounded-xl"
        @click="showAddSheet = true"
      >
        <img src="/icons/add.svg" alt="" class="w-6 h-6" />
        <span class="text-body2 font-semibold text-grey-13">프로젝트 추가</span>
      </button>
    </div>

    <!-- 프로젝트 목록 -->
    <div v-else-if="!isLoading" class="flex-1 overflow-y-auto scrollbar-hide">
      <ul>
        <li
          v-for="project in projects"
          :key="project.id"
          class="flex items-center px-5 py-4 border-b border-grey-4"
        >
          <span class="flex-1 text-label1 font-medium text-grey-13">{{ project.name }}</span>
          <span class="text-caption1 text-grey-7 mr-4">{{ project.retrospectiveCount }}개</span>
          <button class="p-1" @click="confirmDelete(project)">
            <img src="/icons/delete.svg" alt="삭제" class="w-5 h-5" />
          </button>
        </li>
      </ul>
      <div class="flex justify-center py-6">
        <button
          class="flex items-center gap-1 pl-[12px] pr-[18px] py-[9px] bg-primary rounded-xl"
          @click="showAddSheet = true"
        >
          <img src="/icons/add.svg" alt="" class="w-6 h-6" />
          <span class="text-body2 font-semibold text-grey-13">프로젝트 추가</span>
        </button>
      </div>
    </div>

    <!-- 프로젝트 추가 바텀시트 -->
    <Transition name="bottom-sheet">
      <div
        v-if="showAddSheet"
        class="fixed inset-0 z-20 flex flex-col justify-end"
      >
        <div class="fixed inset-0 bg-black/40" @click="closeAddSheet" />
        <div class="sheet-panel relative bg-white rounded-t-2xl px-5 pt-6 pb-10 z-10">
          <p class="text-heading2 font-semibold text-grey-13 mb-5">프로젝트 추가</p>
          <input
            v-model="newProjectName"
            type="text"
            maxlength="15"
            placeholder="프로젝트 이름 (최대 15자)"
            class="w-full h-[48px] px-4 rounded-xl border border-grey-4 bg-grey-1 text-label1 text-grey-13 placeholder:text-grey-6 outline-none focus:border-grey-8 transition-colors"
            @keyup.enter="submitAdd"
          />
          <p class="text-right text-caption1 text-grey-6 mt-1">{{ newProjectName.length }}/15</p>
          <button
            class="w-full h-[50px] rounded-xl mt-4 text-label1 font-semibold transition-none"
            :class="newProjectName.trim().length > 0 ? 'bg-grey-13 text-white' : 'bg-grey-3 text-grey-6'"
            :disabled="newProjectName.trim().length === 0 || isSubmitting"
            @click="submitAdd"
          >추가하기</button>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import type { ApiResponse, Project } from '~/types/api'

definePageMeta({ middleware: 'auth', layout: false })

const { $api } = useNuxtApp()
const router = useRouter()

const projects = useState<Project[]>('projects:list', () => [])
const isLoading = ref(false)
const showAddSheet = ref(false)
const newProjectName = ref('')
const isSubmitting = ref(false)

onMounted(async () => {
  isLoading.value = true
  try {
    const res = await $api.get<ApiResponse<Project[]>>('/api/v1/projects')
    projects.value = res.data.data
  } catch {
    projects.value = []
  } finally {
    isLoading.value = false
  }
})

function closeAddSheet() {
  showAddSheet.value = false
  newProjectName.value = ''
}

async function submitAdd() {
  const name = newProjectName.value.trim()
  if (!name || isSubmitting.value) return
  isSubmitting.value = true
  try {
    await $api.post('/api/v1/projects', { name })
    // 목록 갱신
    const res = await $api.get<ApiResponse<Project[]>>('/api/v1/projects')
    projects.value = res.data.data
    closeAddSheet()
  } catch {
    // 에러 처리 (추후 토스트 추가)
  } finally {
    isSubmitting.value = false
  }
}

async function confirmDelete(project: Project) {
  if (!confirm(`"${project.name}" 프로젝트를 삭제할까요?`)) return
  try {
    await $api.delete(`/api/v1/projects/${project.id}`)
    projects.value = projects.value.filter(p => p.id !== project.id)
  } catch {
    // 에러 처리
  }
}
</script>

<style>
.bottom-sheet-enter-active { transition: opacity 0.3s ease; }
.bottom-sheet-leave-active { transition: opacity 0.25s ease; }
.bottom-sheet-enter-from, .bottom-sheet-leave-to { opacity: 0; }
.bottom-sheet-enter-active .sheet-panel { transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1); }
.bottom-sheet-leave-active .sheet-panel { transition: transform 0.25s cubic-bezier(0.32, 0.72, 0, 1); }
.bottom-sheet-enter-from .sheet-panel, .bottom-sheet-leave-to .sheet-panel { transform: translateY(100%); }
</style>
