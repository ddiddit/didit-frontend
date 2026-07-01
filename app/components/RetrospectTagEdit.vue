<template>
  <div class="absolute inset-0 z-50 bg-grey-1 flex flex-col">
    <!-- 헤더 -->
    <div class="flex items-center h-[50px] px-5 shrink-0">
      <button class="p-1 -ml-1" aria-label="뒤로" @click="$emit('close')">
        <img src="/icons/back.svg" alt="뒤로" class="w-6 h-6" />
      </button>
      <span class="flex-1 text-center text-body2 font-semibold text-grey-13">태그 추가 및 삭제</span>
      <span class="w-6" />
    </div>

    <div class="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-5 pt-2">
      <!-- 선택된 태그 + 입력 -->
      <div class="flex flex-wrap items-center gap-[6px] bg-grey-3 rounded-xl px-4 py-3 min-h-[56px]">
        <span
          v-for="tag in selected"
          :key="tag.id"
          class="inline-flex items-center gap-[2px] rounded-md pl-[6px] pr-1 py-1"
          :class="[colorClasses(tag).bg, colorClasses(tag).text]"
        >
          <span class="text-caption1 font-semibold">#{{ tag.name }}</span>
          <button class="opacity-30" aria-label="태그 제거" @click="deselect(tag)">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </button>
        </span>
        <input
          v-model="input"
          :placeholder="selected.length === 0 ? '태그를 입력 후 엔터를 눌러 태그를 추가하세요' : ''"
          :disabled="selected.length >= 2"
          class="flex-1 min-w-[80px] bg-transparent outline-none text-body3 text-grey-13 placeholder:text-grey-7 disabled:opacity-0"
          @keydown.enter="onEnter"
          @keydown.delete="onBackspace"
        />
      </div>

      <!-- 기존 태그 목록 (선택 안 된 것만) -->
      <div class="flex flex-col mt-4">
        <div
          v-for="tag in availableTags"
          :key="tag.id"
          class="flex h-[52px] items-center justify-between py-3 border-b border-grey-4"
        >
          <button class="flex items-center" @click="select(tag)">
            <span
              class="inline-flex items-center rounded-md px-[6px] py-1"
              :class="[colorClasses(tag).bg, colorClasses(tag).text]"
            >
              <span class="text-caption1 font-semibold">#{{ tag.name }}</span>
            </span>
          </button>
          <button class="shrink-0" aria-label="태그 삭제" @click="askDelete(tag)">
            <img src="/icons/trash.svg" alt="삭제" class="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>
    </div>

    <!-- 하단 -->
    <div class="px-5 shrink-0" style="padding-bottom: max(50px, env(safe-area-inset-bottom, 50px))">
      <p class="text-center text-label2 font-medium text-grey-7 mb-4">
        태그는 최대 2개까지 선택 가능합니다.
      </p>
      <button
        class="w-full h-[60px] rounded-xl text-body2 font-semibold transition-colors"
        :class="canSave ? 'bg-primary text-grey-13' : 'bg-grey-5 text-grey-6'"
        :disabled="!canSave || saving"
        @click="onSave"
      >
        저장
      </button>
    </div>

    <!-- 태그 삭제 확인 (29836) -->
    <UiPopup
      v-model="showDeletePopup"
      title="태그를 삭제하시겠어요?"
      description="해당 태그는 완전히 삭제되며, 이미 적용된 모든 회고에서도 제거돼요."
      confirm-text="삭제"
      cancel-text="취소"
      variant="destructive"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import type { Tag } from '~/types/api'
import { getTagColorClasses } from '~/utils/tag-color'
import { getApiErrorMessage } from '~/utils/api-error'

const props = defineProps<{
  retrospectiveId: string
  currentTags: Tag[]
}>()

const emit = defineEmits<{ close: []; saved: [value: Tag[]] }>()

const retro = useRetrospect()
const org = useOrganization()
const { show } = useToast()

const allTags = ref<Tag[]>([])
const selected = ref<Tag[]>([...props.currentTags])
const input = ref('')
const saving = ref(false)
const showDeletePopup = ref(false)
const pendingDelete = ref<Tag | null>(null)

const colorClasses = (tag: Tag) => getTagColorClasses(tag.id)

// 선택 안 된 태그만 목록에 노출
const availableTags = computed(() => allTags.value.filter((t) => !selected.value.some((s) => s.id === t.id)))

const currentIds = computed(() => new Set(props.currentTags.map((t) => t.id)))
const canSave = computed(() => {
  const sel = selected.value
  if (sel.length !== currentIds.value.size) return true
  return sel.some((t) => !currentIds.value.has(t.id))
})

async function loadTags() {
  try {
    allTags.value = await org.listTags()
  } catch {
    /* noop */
  }
}

function select(tag: Tag) {
  if (selected.value.length >= 2) {
    show('태그는 최대 2개까지 선택할 수 있어요.')
    return
  }
  selected.value.push(tag)
}

function deselect(tag: Tag) {
  selected.value = selected.value.filter((t) => t.id !== tag.id)
}

// 입력 + 엔터 → 새 태그 생성 후 선택 (1~10자)
async function onEnter(e: KeyboardEvent) {
  if (e.isComposing || e.keyCode === 229) return
  e.preventDefault()
  const name = input.value.trim()
  if (!name) return
  if (name.length > 10) {
    show('태그는 1~10자로 입력해 주세요.')
    return
  }
  if (selected.value.length >= 2) return
  // 이미 존재하는 태그면 그걸 선택
  const existing = allTags.value.find((t) => t.name === name)
  if (existing) {
    if (!selected.value.some((s) => s.id === existing.id)) selected.value.push(existing)
    input.value = ''
    return
  }
  try {
    const created = await org.createTag(name)
    allTags.value.push(created)
    selected.value.push(created)
    input.value = ''
  } catch (e) {
    // 중복·형식 오류(DUPLICATED_TAG_NAME, INVALID_TAG_NAME 등) 코드별 문구
    show(getApiErrorMessage(e, '태그를 추가하지 못했어요. 잠시 후 다시 시도해주세요.'))
  }
}

// 빈 입력에서 백스페이스 → 마지막 선택 태그 제거
function onBackspace() {
  if (input.value.length === 0 && selected.value.length > 0) {
    selected.value = selected.value.slice(0, -1)
  }
}

function askDelete(tag: Tag) {
  pendingDelete.value = tag
  showDeletePopup.value = true
}

async function confirmDelete() {
  const tag = pendingDelete.value
  showDeletePopup.value = false
  if (!tag) return
  try {
    await org.deleteTag(tag.id)
    allTags.value = allTags.value.filter((t) => t.id !== tag.id)
    selected.value = selected.value.filter((t) => t.id !== tag.id)
  } catch {
    show('태그 삭제에 실패했어요. 잠시 후 다시 시도해주세요.')
  } finally {
    pendingDelete.value = null
  }
}

async function onSave() {
  if (!canSave.value || saving.value) return
  saving.value = true
  try {
    const selIds = selected.value.map((t) => t.id)
    const toAdd = selected.value.filter((t) => !currentIds.value.has(t.id))
    const toRemove = props.currentTags.filter((t) => !selIds.includes(t.id))
    for (const t of toRemove) await retro.removeTag(props.retrospectiveId, t.id)
    for (const t of toAdd) await retro.addTag(props.retrospectiveId, t.id)
    emit('saved', [...selected.value])
    emit('close')
  } catch {
    show('태그 저장에 실패했어요. 잠시 후 다시 시도해주세요.')
  } finally {
    saving.value = false
  }
}

onMounted(loadTags)
</script>
