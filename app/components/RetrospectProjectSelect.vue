<template>
  <div class="absolute inset-0 z-50 bg-grey-1 flex flex-col">
    <!-- 헤더 -->
    <div class="flex items-center h-[50px] px-5 shrink-0">
      <button class="p-1 -ml-1" aria-label="뒤로" @click="$emit('close')">
        <img src="/icons/back.svg" alt="뒤로" class="w-6 h-6" />
      </button>
      <span class="flex-1 text-center text-body2 font-semibold text-grey-13">프로젝트 선택</span>
      <span class="w-6" />
    </div>

    <!-- 목록 -->
    <div class="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-5">
      <div class="flex flex-col items-center">
        <!-- 자유 회고 (프로젝트 없음) -->
        <button class="flex gap-[14px] items-center w-full py-[11px]" @click="selectFree">
          <img :src="checkSrc(selectedId === null && !adding)" alt="" class="w-6 h-6 shrink-0" />
          <span class="text-body3 font-medium text-left">
            <span class="text-grey-13">자유 회고</span>
            <span class="text-grey-7"> (프로젝트 없음)</span>
          </span>
        </button>

        <!-- 프로젝트들 -->
        <button
          v-for="p in projects"
          :key="p.id"
          class="flex gap-[14px] items-center w-full py-[11px]"
          @click="selectProject(p.id)"
        >
          <img :src="checkSrc(selectedId === p.id && !adding)" alt="" class="w-6 h-6 shrink-0" />
          <span class="text-body3 font-medium text-grey-13 text-left">{{ p.name }}</span>
        </button>

        <!-- 새 프로젝트 입력 (초록 체크 = 선택됨, 포커스 시 하단 보더 — /projects와 동일) -->
        <div v-if="adding" class="flex gap-[14px] items-center w-full py-[11px]">
          <img src="/icons/check-circle-on.svg" alt="" class="w-6 h-6 shrink-0" />
          <div class="flex-1 min-w-0 self-stretch flex items-center border-b border-transparent focus-within:border-grey-5 transition-colors">
            <input
              ref="newProjectEl"
              v-model="newProjectName"
              maxlength="15"
              placeholder="프로젝트 이름을 입력하세요"
              class="w-full bg-transparent text-label1 text-grey-13 placeholder:text-[15px] placeholder:font-normal placeholder:text-grey-7 outline-none py-1"
              @keydown.enter="onNewProjectEnter"
            />
          </div>
        </div>

        <!-- 추가 버튼 (최대 10개) -->
        <button
          v-if="projects.length < 10"
          class="w-[30px] h-[30px] rounded-md bg-grey-4 flex items-center justify-center shrink-0 mt-1"
          aria-label="프로젝트 추가"
          @click="startAddProject"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" class="text-grey-9">
            <path d="M7 2v10M2 7h10" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 하단 -->
    <div class="px-5 shrink-0" style="padding-bottom: max(50px, env(safe-area-inset-bottom, 50px))">
      <p class="text-center text-label2 font-medium text-grey-7 mb-4">
        프로젝트는 최대 10개까지 생성 가능합니다.
      </p>
      <button
        class="w-full h-[60px] rounded-xl text-body2 font-semibold transition-colors"
        :class="canConfirm ? 'bg-primary text-grey-13' : 'bg-grey-5 text-grey-6'"
        :disabled="!canConfirm || saving"
        @click="onConfirm"
      >
        선택 완료
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Project } from '~/types/api'
import { getApiErrorMessage } from '~/utils/api-error'

const props = defineProps<{
  retrospectiveId: string
  currentProjectId: string | null
}>()

const emit = defineEmits<{ close: []; selected: [value: { id: string; name: string } | null] }>()

const retro = useRetrospect()
const org = useOrganization()
const { show } = useToast()

const projects = ref<Project[]>([])
const selectedId = ref<string | null>(props.currentProjectId)
const adding = ref(false)
const newProjectName = ref('')
const newProjectEl = ref<HTMLInputElement | null>(null)
const saving = ref(false)

// 현재 지정값과 달라졌을 때만 '선택 완료' 활성
const canConfirm = computed(() => selectedId.value !== props.currentProjectId)

const checkSrc = (on: boolean) => (on ? '/icons/check-circle-on.svg' : '/icons/check-circle-off.svg')

function selectFree() {
  selectedId.value = null
  adding.value = false
}
function selectProject(pid: string) {
  selectedId.value = pid
  adding.value = false
}

async function loadProjects() {
  try {
    projects.value = await org.listProjects()
  } catch {
    /* noop */
  }
}

function startAddProject() {
  adding.value = true
  newProjectName.value = ''
  nextTick(() => newProjectEl.value?.focus())
}

async function onNewProjectEnter(e: KeyboardEvent) {
  if (e.isComposing || e.keyCode === 229) return
  e.preventDefault()
  const name = newProjectName.value.trim()
  if (!name) return
  try {
    const before = new Set(projects.value.map((p) => p.id))
    await org.createProject(name)
    // 백엔드가 204라 생성된 id를 못 받음 → 목록 재조회 후 새 프로젝트 선택
    projects.value = await org.listProjects()
    const created = projects.value.find((p) => !before.has(p.id))
    if (created) selectedId.value = created.id
    adding.value = false
    newProjectName.value = ''
  } catch (err: unknown) {
    // 중복 이름·개수 초과(DUPLICATED_PROJECT_NAME, PROJECT_LIMIT_EXCEEDED 등) 코드별 문구
    show(getApiErrorMessage(err, '프로젝트를 추가하지 못했어요. 잠시 후 다시 시도해주세요.'))
  }
}

async function onConfirm() {
  if (!canConfirm.value || saving.value) return
  saving.value = true
  try {
    if (selectedId.value === null) {
      await retro.detachProject(props.retrospectiveId)
      emit('selected', null)
    } else {
      await retro.registerProject(props.retrospectiveId, selectedId.value)
      const p = projects.value.find((x) => x.id === selectedId.value)
      emit('selected', p ? { id: p.id, name: p.name } : null)
    }
    emit('close')
  } catch {
    show('프로젝트 지정에 실패했어요. 잠시 후 다시 시도해주세요.')
  } finally {
    saving.value = false
  }
}

onMounted(loadProjects)
</script>
