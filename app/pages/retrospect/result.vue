<template>
  <div class="h-full bg-grey-1 flex flex-col">
    <!-- 로딩 (MAKE_001 / figma 25712): AI 요약 생성 중 -->
    <div v-if="isLoading" class="flex-1 flex flex-col items-center justify-center px-8 text-center">
      <div class="flex gap-[7px] mb-8">
        <span class="dot" />
        <span class="dot" style="animation-delay: 0.12s" />
        <span class="dot" style="animation-delay: 0.24s" />
        <span class="dot" style="animation-delay: 0.36s" />
      </div>
      <p class="text-title2 font-semibold leading-[1.6] text-grey-13">
        <span class="text-green-hover">디딧</span>이 {{ nickname }}님의 회고를<br />정리하고 있어요
      </p>
      <p class="text-body3-reading text-grey-9 mt-3">
        회고 내용을 정리하고<br />핵심 인사이트와 피드백을 찾고 있어요.
      </p>
    </div>

    <!-- 에러: 결과 생성 실패 (figma 31141) -->
    <div v-else-if="isError" class="flex-1 flex flex-col items-center justify-center px-8 text-center gap-5">
      <p class="text-body2 font-semibold text-grey-13">회고 결과를 생성하지 못했어요</p>
      <UiButton size="md" class="w-auto px-6" @click="generate">다시 시도</UiButton>
    </div>

    <!-- 결과 (MAKE_002) -->
    <template v-else-if="result">
      <!-- 헤더 -->
      <div class="flex items-center justify-between h-[50px] px-5 shrink-0">
        <button class="p-1 -ml-1" aria-label="뒤로" @click="navigateTo('/home')">
          <img src="/icons/back.svg" alt="뒤로" class="w-6 h-6" />
        </button>
        <button
          class="text-body2 font-semibold disabled:opacity-40"
          :class="canSave ? 'text-green-hover' : 'text-grey-6'"
          :disabled="!canSave || isSaving"
          @click="onSave"
        >
          저장
        </button>
      </div>

      <!-- 본문 -->
      <div class="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-5 pb-10">
        <RetrospectiveResult
          v-model:title="title"
          :content="result.content"
          :project-name="selectedProject?.name ?? null"
          :tags="selectedTags"
          editable-title
          editable-meta
          @edit-project="showProjectSelect = true"
          @edit-tags="showTagEdit = true"
        />
      </div>
    </template>

    <!-- 프로젝트 선택 / 태그 추가 (풀스크린 오버레이) -->
    <RetrospectProjectSelect
      v-if="showProjectSelect"
      :retrospective-id="completingId"
      :current-project-id="selectedProject?.id ?? null"
      @close="showProjectSelect = false"
      @selected="onProjectSelected"
    />
    <RetrospectTagEdit
      v-if="showTagEdit"
      :retrospective-id="completingId"
      :current-tags="selectedTags"
      @close="showTagEdit = false"
      @saved="onTagsSaved"
    />
  </div>
</template>

<script setup lang="ts">
import type { CompleteRetrospectiveResponse, Tag } from '~/types/api'
import { isAuthError } from '~/utils/api-error'

definePageMeta({ middleware: 'auth', layout: false })

const retro = useRetrospect()
const { show } = useToast()
const { track } = useAmplitude()
const { profile, load: loadProfile } = useProfile()
const { fetchUnnotified } = useBadges()
const { show: showBadge } = useBadgeAcquired()

const completingId = useState<string>('retrospect:completing-id')
// 채팅(start.vue)에서 이미 생성한 결과 — 있으면 재생성 없이 사용
const resultStash = useState<CompleteRetrospectiveResponse | null>('retrospect:result', () => null)

const isLoading = ref(true)
const isError = ref(false)
const isSaving = ref(false)
const result = ref<CompleteRetrospectiveResponse | null>(null)
const title = ref('')

// 프로젝트/태그 선택 (오버레이에서 API로 즉시 반영 후 화면 표시값 갱신)
const showProjectSelect = ref(false)
const showTagEdit = ref(false)
const selectedProject = ref<{ id: string; name: string } | null>(null)
const selectedTags = ref<Tag[]>([])

function onProjectSelected(p: { id: string; name: string } | null) {
  selectedProject.value = p
}
function onTagsSaved(tags: Tag[]) {
  selectedTags.value = tags
}

const nickname = computed(() => profile.value?.nickname ?? '')
const canSave = computed(() => title.value.trim().length > 0)

// 완료 API 호출 → AI 요약 생성
async function generate() {
  if (!completingId.value) {
    navigateTo('/home')
    return
  }
  // 채팅에서 생성을 마치고 넘어온 경우: stash된 결과를 그대로 사용(중복 생성 방지)
  if (resultStash.value) {
    result.value = resultStash.value
    title.value = resultStash.value.title
    resultStash.value = null
    isLoading.value = false
    return
  }
  // 직접 진입/재시도 등 stash가 없을 때만 생성 (폴백)
  isLoading.value = true
  isError.value = false
  try {
    const res = await retro.complete(completingId.value)
    result.value = res
    title.value = res.title
  } catch (e) {
    // 인증 만료는 인터셉터가 로그인으로 보냄 → 에러 화면 X
    if (!isAuthError(e)) isError.value = true
  } finally {
    isLoading.value = false
  }
}

// 저장 (MAKE_003): 제목 확정 → 기록 탭 이동 + 토스트
async function onSave() {
  if (!canSave.value || isSaving.value || !completingId.value) return
  isSaving.value = true
  try {
    await retro.save(completingId.value, title.value.trim())
    track('retrospect_saved', {
      has_project: !!selectedProject.value,
      tag_count: selectedTags.value.length,
      title_length: title.value.trim().length,
    })
    completingId.value = ''
    show('회고가 저장되었어요!')
    navigateTo('/retrospects')
    // 저장으로 새 배지 획득 시 전역 팝업 노출 (app.vue에 마운트되어 네비게이션 후에도 유지).
    // 백엔드 readOnly 트랜잭션 버그로 /popup이 같은 배지를 반복 반환할 수 있어, 기기별로 1회만 노출 가드.
    const newBadges = await fetchUnnotified()
    if (newBadges.length > 0) {
      let shown: string[] = []
      try {
        shown = JSON.parse(localStorage.getItem('shownBadges') ?? '[]')
      } catch {
        shown = []
      }
      const fresh = newBadges.find((b) => !shown.includes(b.code))
      if (fresh) {
        showBadge(fresh)
        localStorage.setItem('shownBadges', JSON.stringify([...shown, fresh.code]))
      }
    }
  } catch {
    track('retrospect_save_failed')
    show('저장에 실패했어요. 잠시 후 다시 시도해주세요.')
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  loadProfile()
  generate()
})
</script>

<style scoped>
.dot {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background-color: theme('colors.primary');
  display: inline-block;
  animation: dot-bounce 0.9s infinite ease-in-out;
}
@keyframes dot-bounce {
  0%,
  60%,
  100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-3px);
  }
}
</style>
