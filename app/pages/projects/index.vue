<template>
  <div class="h-full bg-white flex flex-col">

    <!-- 헤더 -->
    <div class="flex items-center px-5 h-[50px] shrink-0">
      <button class="p-1 -ml-1" @click="router.back()">
        <img src="/icons/back.svg" alt="뒤로" class="w-6 h-6" />
      </button>
      <span class="flex-1 text-center text-body2 font-semibold text-grey-13">프로젝트 편집</span>
      <div class="w-6 h-6" />
    </div>

    <!-- 빈 상태 -->
    <div
      v-if="!isLoading && localProjects.length === 0"
      class="flex-1 flex flex-col items-center justify-center gap-[6px]"
    >
      <img src="/icons/empty-projects.svg" alt="" class="w-[70px] h-[70px] mb-[6px]" />
      <p class="text-heading2 font-semibold text-grey-13">아직 프로젝트가 없어요</p>
      <p class="text-label1-reading font-normal text-grey-9 text-center">
        새 프로젝트를 만들어<br />회고를 정리해 보세요!
      </p>
      <button
        class="flex items-center gap-1 mt-[34px] pl-[12px] pr-[18px] py-[9px] bg-primary rounded-xl"
        @click="addNewProject"
      >
        <img src="/icons/add.svg" alt="" class="w-6 h-6" />
        <span class="text-body2 font-semibold text-grey-13">프로젝트 추가</span>
      </button>
    </div>

    <!-- 프로젝트 리스트 -->
    <div v-else-if="!isLoading" class="flex-1 overflow-y-auto scrollbar-hide bg-white">
      <ul>
        <li
          v-for="(project, index) in localProjects"
          :key="index"
          class="flex items-center px-5 h-[54px] border-b border-grey-4"
        >
          <!-- 삭제 버튼 -->
          <button class="shrink-0 mr-3" @click="requestDelete(project)">
            <img src="/icons/delete.svg" alt="삭제" class="w-6 h-6" />
          </button>

          <!-- 프로젝트명 -->
          <input
            v-if="project.isNew"
            v-model="project.name"
            type="text"
            maxlength="15"
            placeholder="프로젝트 이름을 입력하세요"
            class="flex-1 bg-transparent text-label1 text-grey-13 placeholder:text-grey-6 outline-none border-b border-grey-5 focus:border-grey-13 py-1 transition-colors"
          />
          <span v-else class="flex-1 text-label1 text-grey-13">{{ project.name }}</span>

          <!-- 드래그 핸들 -->
          <svg class="shrink-0 ml-3 cursor-grab" width="12" height="18" viewBox="0 0 12 18" fill="none">
            <circle cx="3" cy="3" r="1.5" fill="#C6C6C6"/>
            <circle cx="9" cy="3" r="1.5" fill="#C6C6C6"/>
            <circle cx="3" cy="9" r="1.5" fill="#C6C6C6"/>
            <circle cx="9" cy="9" r="1.5" fill="#C6C6C6"/>
            <circle cx="3" cy="15" r="1.5" fill="#C6C6C6"/>
            <circle cx="9" cy="15" r="1.5" fill="#C6C6C6"/>
          </svg>
        </li>
      </ul>

      <!-- + 추가 버튼 -->
      <div class="flex justify-center py-5">
        <button
          class="w-[30px] h-[30px] rounded-[6px] bg-grey-4 flex items-center justify-center text-grey-9"
          :disabled="!canAdd"
          @click="addNewProject"
        >
          <svg width="24" height="24" viewBox="0 0 30 30" fill="none">
            <path d="M13.75 16.25H6.25V13.75H13.75V6.25H16.25V13.75H23.75V16.25H16.25V23.75H13.75V16.25Z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 하단 저장 영역 -->
    <div v-if="!isLoading && localProjects.length > 0" class="shrink-0 px-5 pt-3 bg-white" style="padding-bottom: max(50px, env(safe-area-inset-bottom, 50px));">
      <p class="text-center text-label2 font-medium text-grey-7 mb-5">프로젝트는 최대 10개까지 생성 가능합니다</p>
      <UiButton
        :disabled="!hasNewProjects"
        :loading="isSubmitting"
        @click="saveProjects"
      >저장</UiButton>
    </div>

    <!-- 삭제 확인 다이얼로그 -->
    <div v-if="pendingDelete" class="fixed inset-0 z-30 flex items-center justify-center">
      <div class="fixed inset-0 bg-black/40" @click="pendingDelete = null" />
      <div
        class="relative bg-grey-1 rounded-2xl z-10 w-[300px] flex flex-col gap-[14px]"
        style="padding: 16px 20px; box-shadow: 0px 0px 20px 0px rgba(0,0,0,0.10);"
      >
        <h3 class="text-body2 font-semibold text-grey-13 text-center">프로젝트를 삭제하시겠어요?</h3>
        <p class="text-label2 font-normal text-grey-8 text-center leading-[1.5]">
          프로젝트에 포함된 회고는 삭제되지 않으며,<br />전체보기에서 계속 확인할 수 있어요.
        </p>
        <div class="flex gap-3">
          <button
            class="flex-1 h-[50px] rounded-xl bg-grey-5 text-label1 font-semibold text-grey-8 transition-none"
            @click="pendingDelete = null"
          >취소</button>
          <button
            class="flex-1 h-[50px] rounded-xl bg-[#FF3B30] text-label1 font-semibold text-white transition-none"
            :disabled="isDeleting"
            @click="doDelete"
          >삭제</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import type { ApiResponse, Project } from '~/types/api'

definePageMeta({ middleware: 'auth', layout: false })

const { $api } = useNuxtApp()
const router = useRouter()

interface LocalProject {
  id?: string
  name: string
  isNew: boolean
  retrospectiveCount: number
}

const projects = useState<Project[]>('projects:list', () => [])
const isLoading = ref(false)
const localProjects = ref<LocalProject[]>([])
const pendingDelete = ref<LocalProject | null>(null)
const isSubmitting = ref(false)
const isDeleting = ref(false)

const MAX_PROJECTS = 10
const canAdd = computed(() => localProjects.value.length < MAX_PROJECTS)
const hasNewProjects = computed(() =>
  localProjects.value.some(p => p.isNew && p.name.trim().length > 0)
)

onMounted(async () => {
  isLoading.value = true
  try {
    const res = await $api.get<ApiResponse<Project[]>>('/api/v1/projects')
    projects.value = res.data.data
    localProjects.value = projects.value.map(p => ({
      id: p.id,
      name: p.name,
      isNew: false,
      retrospectiveCount: p.retrospectiveCount,
    }))
  } catch {
    localProjects.value = []
  } finally {
    isLoading.value = false
  }
})

function addNewProject() {
  if (!canAdd.value) return
  localProjects.value.push({ name: '', isNew: true, retrospectiveCount: 0 })
  nextTick(() => {
    const inputs = document.querySelectorAll<HTMLInputElement>('input[type="text"]')
    inputs[inputs.length - 1]?.focus()
  })
}

function requestDelete(project: LocalProject) {
  if (project.isNew) {
    localProjects.value = localProjects.value.filter(p => p !== project)
    return
  }
  pendingDelete.value = project
}

async function doDelete() {
  if (!pendingDelete.value?.id || isDeleting.value) return
  isDeleting.value = true
  try {
    await $api.delete(`/api/v1/projects/${pendingDelete.value.id}`)
    const deletedId = pendingDelete.value.id
    localProjects.value = localProjects.value.filter(p => p.id !== deletedId)
    projects.value = projects.value.filter(p => p.id !== deletedId)
    pendingDelete.value = null
  } catch {
  } finally {
    isDeleting.value = false
  }
}

async function saveProjects() {
  if (!hasNewProjects.value || isSubmitting.value) return
  isSubmitting.value = true
  try {
    const newOnes = localProjects.value.filter(p => p.isNew && p.name.trim())
    for (const p of newOnes) {
      await $api.post('/api/v1/projects', { name: p.name.trim() })
    }
    const res = await $api.get<ApiResponse<Project[]>>('/api/v1/projects')
    projects.value = res.data.data
    router.back()
  } catch {
  } finally {
    isSubmitting.value = false
  }
}
</script>
