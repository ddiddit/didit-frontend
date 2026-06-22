<template>
  <div class="h-full bg-grey-1 flex flex-col">
    <!-- 헤더 -->
    <div class="flex items-center justify-between h-[50px] px-5 shrink-0">
      <button class="p-1 -ml-1" aria-label="뒤로" @click="navigateTo('/retrospects')">
        <img src="/icons/back.svg" alt="뒤로" class="w-6 h-6" />
      </button>

      <!-- 더보기 메뉴 -->
      <div v-if="detail" class="relative">
        <button class="p-1 -mr-1" aria-label="더보기" @click="menuOpen = !menuOpen">
          <img src="/icons/more-vertical.svg" alt="더보기" class="w-6 h-6" />
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
        :title="detail.title"
        :content="detail.content"
        :project-name="detail.project?.name ?? null"
        :tags="detail.tags"
      />
    </div>

    <!-- 빈/에러 -->
    <div v-else class="flex-1 flex items-center justify-center px-8 text-center">
      <p class="text-body3 text-grey-7">회고를 불러올 수 없어요.</p>
    </div>

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

definePageMeta({ middleware: 'auth', layout: false })

const route = useRoute()
const retro = useRetrospect()
const { show } = useToast()

const id = computed(() => String(route.params.id))
const detail = ref<RetrospectiveDetail | null>(null)
const isLoading = ref(true)
const menuOpen = ref(false)
const showDeletePopup = ref(false)
const isDeleting = ref(false)

const showProjectSelect = ref(false)
const showTagEdit = ref(false)

// 제목 수정
const editingTitle = ref(false)
const editTitle = ref('')
const isSavingTitle = ref(false)
const canSaveTitle = computed(() => editTitle.value.trim().length > 0)

async function loadDetail() {
  isLoading.value = true
  try {
    detail.value = await retro.getDetail(id.value)
  } catch {
    detail.value = null
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
