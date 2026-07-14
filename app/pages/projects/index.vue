<template>
  <div class="h-full bg-white flex flex-col relative">

    <!-- 헤더 -->
    <div class="flex items-center px-5 h-[50px] shrink-0">
      <button class="p-1 -ml-1" @click="router.back()">
        <img src="/icons/back.svg" alt="뒤로" class="w-6 h-6" />
      </button>
      <span class="flex-1 text-center text-body2 font-semibold text-grey-13">프로젝트 편집</span>
      <div class="w-6 h-6" />
    </div>

    <UiLoadError :error="loadError" :slow="slowLoading" @retry="reload" />

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
    <div v-else-if="!isLoading" class="flex-1 overflow-y-auto scrollbar-hide bg-white" @touchstart.passive="onContainerTouch">
      <ul ref="listEl">
        <li
          v-for="(project, index) in localProjects"
          :key="project.id ?? `new-${index}`"
          class="flex items-center px-5 h-[46px] bg-white"
        >
          <!-- 삭제 버튼 -->
          <button class="shrink-0 mr-3" @click="requestDelete(project)">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="#FF5C5C"/>
              <rect x="7" y="11.25" width="10" height="1.5" rx="0.75" fill="white"/>
            </svg>
          </button>

          <!-- 프로젝트명 / 입력 필드 (밑줄은 이 영역에만) -->
          <div
            class="flex-1 self-stretch flex items-center border-b transition-colors"
            :class="focusedIndex === index ? 'border-grey-5' : 'border-transparent'"
          >
            <input
              v-if="project.isNew || project.isEditing"
              :ref="el => setInputRef(el, index)"
              v-model="project.name"
              type="text"
              maxlength="15"
              :placeholder="project.isNew ? '프로젝트 이름을 입력하세요' : ''"
              class="w-full bg-transparent text-body3 font-medium text-grey-13 placeholder:text-[15px] placeholder:font-normal placeholder:text-[#989898] outline-none py-1"
              @focus="focusedIndex = index"
              @blur="onInputBlur(project, index)"
              @keydown.enter.prevent="inputRefs[index]?.blur()"
            />
            <span
              v-else
              class="w-full text-body3 font-medium text-grey-13 py-1 cursor-text"
              @click="startEditing(project, index)"
            >{{ project.name }}</span>
          </div>

          <!-- 드래그 핸들 -->
          <img src="/icons/drag-handle.svg" alt="" class="drag-handle shrink-0 ml-3 w-6 h-6 cursor-grab touch-none" />
        </li>
      </ul>

      <!-- + 추가 버튼 -->
      <div class="flex justify-center pt-3">
        <button
          class="w-[30px] h-[30px] rounded-[6px] bg-grey-4 flex items-center justify-center text-grey-9"
          :disabled="!canAdd"
          @click="addNewProject"
        >
          <svg width="24" height="24" viewBox="-2.5 -2.5 35 35" fill="none">
            <path d="M13.75 16.25H6.25V13.75H13.75V6.25H16.25V13.75H23.75V16.25H16.25V23.75H13.75V16.25Z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 하단 저장 영역 -->
    <div v-if="!isLoading && localProjects.length > 0" class="shrink-0 px-5 pt-3 bg-white safe-bottom">
      <p class="text-center text-label2 font-medium text-grey-7 mb-5">프로젝트는 최대 10개까지 생성 가능합니다</p>
      <UiButton
        :disabled="!hasChanges"
        :loading="isSubmitting"
        @click="saveProjects"
      >저장</UiButton>
    </div>

    <!-- 삭제 확인 다이얼로그 (공용 팝업: 문구 여백·취소 버튼 스타일 시안 준수) -->
    <UiPopup
      :model-value="!!pendingDelete"
      title="프로젝트를 삭제하시겠어요?"
      :description="'프로젝트에 포함된 회고는 삭제되지 않으며,\n전체보기에서 계속 확인할 수 있어요.'"
      confirm-text="삭제"
      cancel-text="취소"
      variant="destructive"
      :loading="isDeleting"
      @update:model-value="(v: boolean) => { if (!v) pendingDelete = null }"
      @confirm="doDelete"
    />

  </div>
</template>

<script setup lang="ts">
import { useSortable } from '@vueuse/integrations/useSortable'
import type { ApiResponse, Project } from '~/types/api'

definePageMeta({ middleware: 'auth', layout: false })

const { $api } = useNuxtApp()
const router = useRouter()
const { track } = useAmplitude()

interface LocalProject {
  id?: string
  name: string
  originalName: string
  isNew: boolean
  isEditing: boolean
}

const projects = useState<Project[]>('projects:list', () => [])
const { isLoading, loadError, slowLoading, run } = useLoadState()
const localProjects = ref<LocalProject[]>([])
const pendingDelete = ref<LocalProject | null>(null)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const focusedIndex = ref<number | null>(null)

// 드래그 순서변경 (sortablejs)
const listEl = ref<HTMLElement | null>(null)
const { start: startSortable, stop: stopSortable } = useSortable(listEl, localProjects, {
  handle: '.drag-handle',
  animation: 150,
  // onEnd는 기본 onUpdate(배열 이동)를 덮어쓰지 않음. 이동 반영 후(nextTick) 순서 저장
  onEnd: () => {
    nextTick(persistOrder)
  },
})
// 리스트는 로딩 후 조건부 렌더라 마운트 시점엔 없음 → 엘리먼트가 생기거나 교체될 때 (재)초기화
watch(listEl, (el) => {
  stopSortable()
  if (el) startSortable()
})

// 현재 순서를 백엔드에 저장 (저장된 프로젝트만 대상)
async function persistOrder() {
  const ids = localProjects.value
    .filter(p => p.id)
    .map(p => p.id as string)
  if (ids.length < 2) return
  try {
    await $api.patch('/api/v1/projects/order', { projectIds: ids })
    // 전역 projects 상태도 동일 순서로 동기화
    projects.value = ids
      .map(id => projects.value.find(p => p.id === id))
      .filter((p): p is Project => !!p)
  } catch { /* 오류 처리 */ }
}

// input ref 맵 (포커스 제어용)
const inputRefs = ref<Record<number, HTMLInputElement | null>>({})
function setInputRef(el: unknown, index: number) {
  inputRefs.value[index] = el as HTMLInputElement | null
}

const MAX_PROJECTS = 10
const canAdd = computed(() => localProjects.value.length < MAX_PROJECTS)
// 기존 상태에서 수정된 게 있으면(신규 추가·이름 변경) 저장 버튼 활성화
const hasChanges = computed(() =>
  localProjects.value.some(p =>
    p.isNew ? p.name.trim().length > 0 : p.name.trim() !== p.originalName,
  )
)

async function reload() {
  await run(async () => {
    const res = await $api.get<ApiResponse<Project[]>>('/api/v1/projects')
    projects.value = res.data.data
    localProjects.value = projects.value.map(p => ({
      id: p.id,
      name: p.name,
      originalName: p.name,
      isNew: false,
      isEditing: false,
    }))
  })
}

onMounted(() => {
  track('project_list_viewed')
  reload()
})

// 빈 공간 터치로 키보드를 내린 직후엔, 이어지는 click이 이름 영역(span)에 떨어져도
// startEditing으로 재포커스되지 않도록 잠시 편집 진입을 막는다 (키보드가 내려간 상태 유지)
let suppressEditUntil = 0

function onContainerTouch(e: TouchEvent) {
  if (focusedIndex.value === null) return
  const input = inputRefs.value[focusedIndex.value]
  if (input && e.target !== input) {
    suppressEditUntil = performance.now() + 500
    input.blur()
  }
}

function addNewProject() {
  if (!canAdd.value) return
  localProjects.value.push({ name: '', originalName: '', isNew: true, isEditing: false })
  const newIndex = localProjects.value.length - 1
  nextTick(() => {
    inputRefs.value[newIndex]?.focus()
  })
}

function startEditing(project: LocalProject, index: number) {
  if (performance.now() < suppressEditUntil) return
  project.isEditing = true
  nextTick(() => {
    inputRefs.value[index]?.focus()
  })
}

// 이름 변경은 blur 시 바로 저장하지 않고 '저장' 버튼으로 일괄 반영
function onInputBlur(project: LocalProject, _index: number) {
  focusedIndex.value = null

  if (project.isEditing) {
    const trimmed = project.name.trim()
    // 빈 값이면 원래 이름으로 복원
    project.name = trimmed || project.originalName
    project.isEditing = false
  }
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
    const deletedName = pendingDelete.value.name
    await $api.delete(`/api/v1/projects/${pendingDelete.value.id}`)
    track('project_deleted', { project_name: deletedName })
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
  if (!hasChanges.value || isSubmitting.value) return
  isSubmitting.value = true
  try {
    // 기존 프로젝트 이름 변경 반영
    const renamed = localProjects.value.filter(p => !p.isNew && p.id && p.name.trim() !== p.originalName)
    for (const p of renamed) {
      await $api.patch(`/api/v1/projects/${p.id}/name`, { name: p.name.trim() })
      p.originalName = p.name.trim()
    }
    // 신규 프로젝트 생성
    const newOnes = localProjects.value.filter(p => p.isNew && p.name.trim())
    for (const p of newOnes) {
      await $api.post('/api/v1/projects', { name: p.name.trim() })
    }
    if (newOnes.length > 0) track('project_created', { count: newOnes.length })
    const res = await $api.get<ApiResponse<Project[]>>('/api/v1/projects')
    projects.value = res.data.data
    router.back()
  } catch {
  } finally {
    isSubmitting.value = false
  }
}
</script>
