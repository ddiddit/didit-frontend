<template>
  <div class="h-full bg-grey-1 flex flex-col">
    <!-- 헤더 -->
    <div class="flex items-center justify-between h-[50px] px-5 shrink-0">
      <button class="p-1 -ml-1" aria-label="뒤로" @click="navigateTo('/retrospects')">
        <img src="/icons/back.svg" alt="뒤로" class="w-6 h-6" />
      </button>

      <!-- 더보기 메뉴 -->
      <div v-if="detail" class="relative">
        <!-- 가로 미트볼(tabler dots-filled) — 인라인 SVG로 렌더 (파일 로드 실패 방지) -->
        <button class="p-1 -mr-1 text-grey-13" aria-label="더보기" @click="menuOpen = !menuOpen">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6">
            <path d="M7 12C7 12.5304 6.78929 13.0391 6.41421 13.4142C6.03914 13.7893 5.53043 14 5 14C4.46957 14 3.96086 13.7893 3.58579 13.4142C3.21071 13.0391 3 12.5304 3 12C3 11.9647 3.00167 11.9307 3.005 11.898C3.03017 11.386 3.25139 10.9033 3.6228 10.5499C3.99422 10.1965 4.48735 9.99964 5 10C5.53043 10 6.03914 10.2107 6.41421 10.5858C6.78929 10.9609 7 11.4696 7 12ZM14 12C14 12.5304 13.7893 13.0391 13.4142 13.4142C13.0391 13.7893 12.5304 14 12 14C11.4696 14 10.9609 13.7893 10.5858 13.4142C10.2107 13.0391 10 12.5304 10 12C10 11.9647 10.0017 11.9307 10.005 11.898C10.0302 11.386 10.2514 10.9033 10.6228 10.5499C10.9942 10.1965 11.4874 9.99964 12 10C12.5304 10 13.0391 10.2107 13.4142 10.5858C13.7893 10.9609 14 11.4696 14 12ZM21 12C21 12.5304 20.7893 13.0391 20.4142 13.4142C20.0391 13.7893 19.5304 14 19 14C18.4696 14 17.9609 13.7893 17.5858 13.4142C17.2107 13.0391 17 12.5304 17 12C17 11.9647 17.0017 11.9307 17.005 11.898C17.0302 11.386 17.2514 10.9033 17.6228 10.5499C17.9942 10.1965 18.4874 9.99964 19 10C19.5304 10 20.0391 10.2107 20.4142 10.5858C20.7893 10.9609 21 11.4696 21 12Z" fill="currentColor"/>
          </svg>
        </button>
        <div
          v-if="menuOpen"
          class="absolute right-0 top-[38px] z-20 w-[160px] bg-grey-1 rounded-xl shadow-card py-2"
        >
          <button class="w-full text-left px-4 py-2.5 text-body3 text-grey-13" @click="onMenu('project')">
            프로젝트 변경
          </button>
          <button class="w-full text-left px-4 py-2.5 text-body3 text-grey-13" @click="onMenu('title')">
            회고 제목 수정
          </button>
          <button class="w-full text-left px-4 py-2.5 text-body3 text-grey-13" @click="onMenu('tags')">
            태그 추가 및 삭제
          </button>
          <button class="w-full text-left px-4 py-2.5 text-body3 text-danger-50" @click="onMenu('delete')">
            회고 삭제
          </button>
        </div>
      </div>
      <span v-else class="w-6" />
    </div>

    <!-- 로딩 -->
    <div v-if="isLoading" class="flex-1 flex items-center justify-center">
      <span class="text-body3 text-grey-7">불러오는 중…</span>
    </div>

    <!-- 본문 -->
    <div v-else-if="detail && detail.content" class="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-5 pb-10">
      <RetrospectiveResult
        variant="detail"
        :title="detail.title"
        :content="detail.content"
        :project-name="detail.project?.name ?? null"
        :tags="detail.tags"
        :date="dateLabel"
        @open-project="goProjectRetrospects"
      />
    </div>

    <!-- 에러: 회고 조회 실패 (figma 회고 결과 조회 실패). 인증 만료는 제외(로그인 이동) -->
    <UiErrorState
      v-else-if="!authFailed"
      icon="/icons/error-reload.svg"
      title="회고 내용을 불러오지 못했어요"
      description="다시 시도해 주세요."
      action-text="다시 시도"
      @action="loadDetail"
    />

    <!-- 메뉴 외부 클릭 닫기 -->
    <div v-if="menuOpen" class="fixed inset-0 z-10" @click="menuOpen = false" />

    <!-- 삭제 확인 -->
    <UiPopup
      v-model="showDeletePopup"
      title="회고를 삭제하시겠어요?"
      description="삭제된 회고는 복구할 수 없어요."
      confirm-text="삭제"
      cancel-text="취소"
      variant="destructive"
      :loading="isDeleting"
      @confirm="onDelete"
    />

    <!-- 프로젝트 변경 / 태그 추가삭제 (풀스크린 오버레이) -->
    <RetrospectProjectSelect
      v-if="showProjectSelect && detail"
      :retrospective-id="id"
      :current-project-id="detail.project?.id ?? null"
      @close="showProjectSelect = false"
      @selected="onProjectSelected"
    />
    <RetrospectTagEdit
      v-if="showTagEdit && detail"
      :retrospective-id="id"
      :current-tags="detail.tags"
      @close="showTagEdit = false"
      @saved="onTagsSaved"
    />

    <!-- 회고 제목 수정 바텀시트 (figma 30659/30701) -->
    <UiBottomSheet v-model="editingTitle">
      <p class="text-body1 font-semibold text-grey-13 text-center">회고 제목 수정</p>
      <div class="w-full flex flex-col gap-10">
        <!-- 입력 + 카운터 -->
        <div class="flex items-center justify-between gap-2 bg-grey-3 rounded-xl h-14 p-4">
          <input
            v-model="editTitle"
            maxlength="25"
            placeholder="회고 제목을 입력하세요"
            class="flex-1 min-w-0 bg-transparent outline-none text-body3 font-medium text-grey-13 placeholder:text-grey-7"
          />
          <span class="text-caption2 font-medium text-grey-7 shrink-0">{{ editTitle.length }}/25</span>
        </div>
        <!-- 저장 -->
        <button
          class="w-full h-[60px] rounded-xl text-body2 font-semibold transition-colors"
          :class="canSaveTitle ? 'bg-primary text-grey-13' : 'bg-grey-5 text-grey-6'"
          :disabled="!canSaveTitle || isSavingTitle"
          @click="saveTitle"
        >
          저장
        </button>
      </div>
    </UiBottomSheet>
  </div>
</template>

<script setup lang="ts">
import type { RetrospectiveDetail, Tag } from '~/types/api'
import { isAuthError } from '~/utils/api-error'
import { parseServerDate } from '~/utils/date'

definePageMeta({ middleware: 'auth', layout: false })

const route = useRoute()
const retro = useRetrospect()
const { show } = useToast()
const { track } = useAmplitude()

const id = computed(() => String(route.params.id))
const detail = ref<RetrospectiveDetail | null>(null)
const isLoading = ref(true)
const authFailed = ref(false) // 인증 만료 시 에러 화면 대신 로그인 리다이렉트(인터셉터)
const menuOpen = ref(false)
const showDeletePopup = ref(false)
const isDeleting = ref(false)

const showProjectSelect = ref(false)
const showTagEdit = ref(false)

// 작성 날짜 (제목 상단 노출)
const dateLabel = computed(() => {
  const raw = detail.value?.completedAt
  if (!raw) return null
  const d = parseServerDate(raw)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
})

// 프로젝트명 클릭 → 해당 프로젝트 회고 목록으로 이동
function goProjectRetrospects() {
  const projectId = detail.value?.project?.id
  if (projectId) navigateTo({ path: '/retrospects', query: { projectId } })
}

// 제목 수정
const editingTitle = ref(false)
const editTitle = ref('')
const isSavingTitle = ref(false)
const canSaveTitle = computed(() => editTitle.value.trim().length > 0)

async function loadDetail() {
  isLoading.value = true
  authFailed.value = false
  try {
    detail.value = await retro.getDetail(id.value)
    track('retrospect_viewed', { retrospect_id: id.value })
  } catch (e) {
    // 인증 만료는 인터셉터가 로그인으로 보냄 → 에러 화면 X
    if (isAuthError(e)) { authFailed.value = true; return }
    detail.value = null // 실패 시 에러 화면(UiErrorState) 노출 → 다시 시도 시 재호출
  } finally {
    isLoading.value = false
  }
}

function onMenu(action: 'project' | 'title' | 'tags' | 'delete') {
  menuOpen.value = false
  if (action === 'delete') {
    showDeletePopup.value = true
  } else if (action === 'project') {
    showProjectSelect.value = true
  } else if (action === 'tags') {
    showTagEdit.value = true
  } else if (action === 'title') {
    editTitle.value = detail.value?.title ?? ''
    editingTitle.value = true
  }
}

async function saveTitle() {
  if (!canSaveTitle.value || isSavingTitle.value || !detail.value) return
  isSavingTitle.value = true
  try {
    const next = editTitle.value.trim()
    await retro.updateTitle(id.value, next)
    detail.value.title = next
    editingTitle.value = false
  } catch {
    show('제목 수정에 실패했어요. 잠시 후 다시 시도해주세요.')
  } finally {
    isSavingTitle.value = false
  }
}

function onProjectSelected(p: { id: string; name: string } | null) {
  if (detail.value) detail.value.project = p
}
function onTagsSaved(tags: Tag[]) {
  if (detail.value) detail.value.tags = tags
}

async function onDelete() {
  if (isDeleting.value) return
  isDeleting.value = true
  try {
    await retro.remove(id.value)
    show('회고가 삭제되었어요.')
    navigateTo('/retrospects')
  } catch {
    show('삭제에 실패했어요. 잠시 후 다시 시도해주세요.')
  } finally {
    isDeleting.value = false
    showDeletePopup.value = false
  }
}

onMounted(loadDetail)
</script>
