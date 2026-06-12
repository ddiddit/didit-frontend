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
            class="flex-1 bg-transparent text-label1 text-grey-13 placeholder:text-grey-6 outline-none border-b border-transparent focus:border-grey-13 py-1 transition-colors"
          />
          <span v-else class="flex-1 text-label1 text-grey-13">{{ project.name }}</span>

          <!-- 드래그 핸들 -->
          <div class="shrink-0 flex gap-[3px] ml-3 cursor-grab">
            <div class="flex flex-col gap-[3px]">
              <div class="w-[3px] h-[3px] rounded-full bg-grey-6" />
              <div class="w-[3px] h-[3px] rounded-full bg-grey-6" />
              <div class="w-[3px] h-[3px] rounded-full bg-grey-6" />
            </div>
            <div class="flex flex-col gap-[3px]">
              <div class="w-[3px] h-[3px] rounded-full bg-grey-6" />
              <div class="w-[3px] h-[3px] rounded-full bg-grey-6" />
              <div class="w-[3px] h-[3px] rounded-full bg-grey-6" />
            </div>
          </div>
        </li>
      </ul>

      <!-- + 추가 버튼 -->
      <div class="flex justify-center py-5">
        <button
          class="w-8 h-8 rounded-full bg-grey-5 flex items-center justify-center"
          :disabled="!canAdd"
          @click="addNewProject"
        >
          <span class="text-grey-9 text-xl leading-none">+</span>
        </button>
      </div>
    </div>

    <!-- 하단 저장 영역 -->
    <div v-if="!isLoading && localProjects.length > 0" class="shrink-0 px-5 pt-3 pb-8 bg-background">
      <p class="text-center text-caption1 text-grey-7 mb-3">프로젝트는 최대 10개까지 생성 가능합니다</p>
      <button
        class="w-full h-[50px] rounded-xl text-label1 font-semibold transition-none"
        :class="hasNewProjects ? 'bg-grey-13 text-white' : 'bg-grey-4 text-grey-7'"
        :disabled="!hasNewProjects || isSubmitting"
        @click="saveProjects"
      >저장</button>
    </div>

    <!-- 삭제 확인 다이얼로그 -->
    <div v-if="pendingDelete" class="fixed inset-0 z-30 flex items-center justify-center px-5">
      <div class="fixed inset-0 bg-black/40" @click="pendingDelete = null" />
      <div class="relative bg-white rounded-2xl px-6 pt-7 pb-6 w-full z-10">
        <h3 class="text-body2 font-semibold text-grey-13 text-center mb-2">프로젝트를 삭제하시겠어요?</h3>
        <p class="text-label2 font-normal text-grey-7 text-center mb-6 leading-[1.5]">
          프로젝트에 포함된 회고는 삭제되지 않으며,<br />전체보기에서 계속 확인할 수 있어요.
        </p>
        <div class="flex gap-3">
          <button
            class="flex-1 h-[50px] rounded-xl bg-grey-4 text-label1 font-semibold text-grey-13 transition-none"
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
    localProjects.value = projects.value.map(p => ({
      id: p.id,
      name: p.name,
      isNew: false,
      retrospectiveCount: p.retrospectiveCount,
    }))
  } catch {
  } finally {
    isSubmitting.value = false
  }
}
</script>
