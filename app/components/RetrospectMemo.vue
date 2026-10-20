<template>
  <div class="flex flex-col gap-6">
    <!-- 로딩 -->
    <p v-if="isLoading" class="text-body3 text-grey-7 text-center py-10">불러오는 중…</p>

    <!-- 조회 실패 -->
    <div v-else-if="loadFailed" class="flex flex-col items-center gap-3 py-10">
      <p class="text-body3 text-grey-7">메모를 불러오지 못했어요</p>
      <UiButton variant="chip" size="sm" @click="load">다시 시도</UiButton>
    </div>

    <template v-else>
      <!-- 새 메모 작성 — 회고별로 하루 1개만 작성 가능해, 오늘 메모가 이미 있으면 숨긴다 -->
      <RetrospectMemoInput v-if="!hasTodayMemo" ref="newInput" :saving="isSaving" @save="onCreate" />

      <!-- 메모 목록 (memoDate 최신순) -->
      <div v-for="memo in memos" :key="memo.id" class="flex flex-col gap-2">
        <RetrospectMemoInput
          v-if="editingId === memo.id"
          :initial="memo.content"
          :saving="isSaving"
          cancelable
          autofocus
          @save="onUpdate(memo, $event)"
          @cancel="editingId = null"
        />
        <template v-else>
          <div class="flex items-center justify-between">
            <!-- 수정한 메모는 날짜 옆에 '(수정됨)' 표기 -->
            <p class="text-label1 font-medium text-grey-8">
              {{ formatMemoDate(memo.memoDate) }}<span v-if="isEdited(memo)">(수정됨)</span>
            </p>
            <button class="p-1 -mr-1" aria-label="메모 더보기" @click="menuMemo = memo">
              <img src="/icons/more-horizontal.svg" alt="" class="w-5 h-5" />
            </button>
          </div>
          <p class="text-body3-reading text-grey-13 whitespace-pre-line break-words">{{ memo.content }}</p>
        </template>
      </div>
    </template>

    <!-- 메모 더보기 — 수정하기 / 삭제하기 -->
    <UiBottomSheet :model-value="!!menuMemo" @update:model-value="menuMemo = null">
      <div class="w-full flex flex-col">
        <button class="flex items-center gap-3 px-2 py-3 text-body3 text-grey-13" @click="onMenuEdit">
          <Icon name="material-symbols:edit-outline-rounded" class="w-5 h-5 text-grey-8" />
          수정하기
        </button>
        <button class="flex items-center gap-3 px-2 py-3 text-body3 text-grey-13" @click="onMenuDelete">
          <Icon name="material-symbols:delete-outline-rounded" class="w-5 h-5 text-grey-8" />
          삭제하기
        </button>
      </div>
    </UiBottomSheet>

    <!-- 삭제 확인 -->
    <UiPopup
      v-model="showDeletePopup"
      title="메모를 삭제하시겠어요?"
      description="삭제된 메모는 복구할 수 없어요."
      confirm-text="삭제"
      cancel-text="취소"
      variant="destructive"
      :loading="isDeleting"
      @confirm="onDelete"
    />
  </div>
</template>

<script setup lang="ts">
import RetrospectMemoInput from '~/components/RetrospectMemoInput.vue'
import UiBottomSheet from '~/components/ui/UiBottomSheet.vue'
import UiButton from '~/components/ui/UiButton.vue'
import UiPopup from '~/components/ui/UiPopup.vue'
import type { RetrospectiveMemo } from '~/types/api'
import { isAuthError } from '~/utils/api-error'

const props = defineProps<{ retrospectiveId: string }>()

const retro = useRetrospect()
const { show } = useToast()

const memos = ref<RetrospectiveMemo[]>([])
const isLoading = ref(true)
const loadFailed = ref(false)
const isSaving = ref(false)
const editingId = ref<string | null>(null)
const menuMemo = ref<RetrospectiveMemo | null>(null)
const deleteTarget = ref<RetrospectiveMemo | null>(null)
const showDeletePopup = ref(false)
const isDeleting = ref(false)
const newInput = ref<InstanceType<typeof RetrospectMemoInput> | null>(null)

// 하루 1개 기준은 한국 서비스 날짜 — 기기 시간대와 무관하게 KST 날짜(YYYY-MM-DD)로 비교
function todayKst(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date())
}
const hasTodayMemo = computed(() => memos.value.some((m) => m.memoDate === todayKst()))

function formatMemoDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  return `${y}년 ${m}월 ${d}일`
}

function isEdited(memo: RetrospectiveMemo): boolean {
  return !!memo.createdAt && !!memo.updatedAt && memo.createdAt !== memo.updatedAt
}

function sortMemos(list: RetrospectiveMemo[]): RetrospectiveMemo[] {
  return [...list].sort((a, b) => b.memoDate.localeCompare(a.memoDate))
}

async function load() {
  isLoading.value = true
  loadFailed.value = false
  try {
    memos.value = sortMemos(await retro.getMemos(props.retrospectiveId))
  } catch (e) {
    // 인증 만료는 인터셉터가 로그인으로 보냄
    if (!isAuthError(e)) loadFailed.value = true
  } finally {
    isLoading.value = false
  }
}

async function onCreate(content: string) {
  if (isSaving.value) return
  isSaving.value = true
  try {
    const memo = await retro.createMemo(props.retrospectiveId, content)
    memos.value = sortMemos([memo, ...memos.value])
    newInput.value?.clear()
  } catch {
    show('메모 저장에 실패했어요. 잠시 후 다시 시도해주세요.')
  } finally {
    isSaving.value = false
  }
}

async function onUpdate(memo: RetrospectiveMemo, content: string) {
  if (isSaving.value) return
  isSaving.value = true
  try {
    const updated = await retro.updateMemo(props.retrospectiveId, memo.id, content)
    memos.value = memos.value.map((m) => (m.id === memo.id ? updated : m))
    editingId.value = null
  } catch {
    show('메모 수정에 실패했어요. 잠시 후 다시 시도해주세요.')
  } finally {
    isSaving.value = false
  }
}

function onMenuEdit() {
  editingId.value = menuMemo.value?.id ?? null
  menuMemo.value = null
}

function onMenuDelete() {
  deleteTarget.value = menuMemo.value
  menuMemo.value = null
  showDeletePopup.value = true
}

async function onDelete() {
  const target = deleteTarget.value
  if (!target || isDeleting.value) return
  isDeleting.value = true
  try {
    await retro.deleteMemo(props.retrospectiveId, target.id)
    memos.value = memos.value.filter((m) => m.id !== target.id)
    if (editingId.value === target.id) editingId.value = null
  } catch {
    show('메모 삭제에 실패했어요. 잠시 후 다시 시도해주세요.')
  } finally {
    isDeleting.value = false
    showDeletePopup.value = false
    deleteTarget.value = null
  }
}

onMounted(load)
</script>
