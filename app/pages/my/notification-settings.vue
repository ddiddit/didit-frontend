<template>
  <div class="h-full bg-white flex flex-col">

    <!-- 헤더 -->
    <div class="flex items-center px-5 h-[50px] shrink-0">
      <button class="p-1 -ml-1" @click="navigateTo('/my')">
        <img src="/icons/back.svg" alt="뒤로" class="w-6 h-6" />
      </button>
      <span class="flex-1 text-center text-body2 font-semibold text-grey-13">알림 설정</span>
      <div class="w-6 h-6" />
    </div>

    <!-- 로딩 -->
    <div v-if="isLoading" class="flex-1 flex items-center justify-center">
      <span class="w-6 h-6 border-2 border-grey-5 border-t-primary rounded-full animate-spin" />
    </div>

    <!-- 설정 목록 -->
    <div v-else class="flex-1 overflow-y-auto">
      <div class="flex flex-col gap-5 px-5 pt-6 pb-10">

        <!-- 마케팅 정보 수신 동의 -->
        <div class="flex items-center gap-4">
          <span class="flex-1 text-body2 font-medium text-grey-10">마케팅 정보 수신 동의</span>
          <UiToggle :model-value="marketingAgreed" @update:model-value="toggleMarketing" />
        </div>
        <div class="h-px bg-grey-4" />

        <!-- 야간 푸시 알림 동의 -->
        <div class="flex items-center gap-4">
          <span class="flex-1 text-body2 font-medium text-grey-10">야간 푸시 알림 동의</span>
          <UiToggle :model-value="nightPushConsent" @update:model-value="toggleNightPush" />
        </div>
        <div class="h-px bg-grey-4" />

        <!-- 회고 작성 알림 동의 -->
        <div class="flex items-center gap-4">
          <span class="flex-1 text-body2 font-medium text-grey-10">회고 작성 알림 동의</span>
          <UiToggle :model-value="enabled" @update:model-value="toggleEnabled" />
        </div>
        <div class="h-px bg-grey-4" />

        <!-- 회고 알림 시간 (회고 작성 알림 동의가 켜져 있을 때만 설정 가능) -->
        <button
          class="w-full flex items-center gap-4 text-left"
          :disabled="!enabled"
          @click="openTimePicker"
        >
          <div class="flex-1 flex flex-col gap-1">
            <span class="text-body2 font-medium text-grey-10">회고 알림 시간</span>
            <span class="text-[12px] font-medium leading-[136%] tracking-[-0.02em] text-grey-7">설정한 시간에 회고 알림을 보내드립니다.</span>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <span class="text-body2 font-semibold leading-none mt-px" :class="enabled ? 'text-[#37C58A]' : 'text-grey-6'">{{ reminderTimeLabel }}</span>
            <img src="/icons/chevron-right-sm.svg" alt="" class="w-6 h-6" />
          </div>
        </button>
        <div class="h-px bg-grey-4" />

      </div>
    </div>

    <!-- 시간 피커 (회고 기록 스타일) -->
    <Teleport to="#app-container">
      <Transition name="picker-fade">
        <div
          v-if="showTimePicker"
          class="absolute inset-0 z-20 bg-black/40"
          @click="showTimePicker = false"
        />
      </Transition>
      <Transition name="picker-slide">
        <div
          v-if="showTimePicker"
          class="absolute left-5 right-5 z-30"
          style="bottom: 30px;"
          @click.stop
        >
          <div
            class="relative w-full bg-grey-1 rounded-[36px] overflow-hidden pt-8 px-5 pb-5"
            :style="dragStyle"
            @transitionend="onSheetTransitionEnd"
          >
            <!-- 드래그 핸들 -->
            <div class="absolute top-[10px] left-1/2 -translate-x-1/2 w-[50px] h-1 rounded-full bg-grey-5" />
            <!-- 아래로 드래그해서 닫기 (상단 핸들·타이틀 영역만, 피커 스크롤과 분리) -->
            <div
              class="absolute top-0 left-0 right-0 h-16 z-10 touch-none cursor-grab active:cursor-grabbing"
              @pointerdown="onDragStart"
              @pointermove="onDragMove"
              @pointerup="onDragEnd"
              @pointercancel="onDragEnd"
            />

            <!-- 타이틀 -->
            <h2 class="text-[17px] font-semibold leading-[140%] tracking-[-0.02em] text-grey-13 text-center mb-6">푸시 알림 시간</h2>

            <!-- 드럼롤 피커 (디자인 기준 62px 고정폭 컬럼, 가운데 정렬) -->
            <div class="flex items-center justify-center mb-6">
              <UiScrollPicker
                :key="`p-${pickerKey}`"
                :model-value="pickerPeriod"
                :items="periodItems"
                :row-h="30"
                :visible-rows="5"
                :width="62"
                @update:model-value="pickerPeriod = $event as string"
              />
              <UiScrollPicker
                :key="`h-${pickerKey}`"
                :model-value="pickerHour"
                :items="hourItems"
                :row-h="30"
                :visible-rows="5"
                :width="62"
                @update:model-value="pickerHour = $event as number"
              />
              <span class="shrink-0 w-4 mb-[3px] text-center text-[20px] font-bold text-grey-13 leading-none">:</span>
              <UiScrollPicker
                :key="`m-${pickerKey}`"
                :model-value="pickerMinute"
                :items="minuteItems"
                :row-h="30"
                :visible-rows="5"
                :width="62"
                @update:model-value="pickerMinute = $event as number"
              />
            </div>

            <!-- 야간 경고 (높이를 부드럽게 펼쳐 버튼이 튀지 않게) -->
            <div
              class="grid transition-[grid-template-rows] duration-200 ease-out"
              :class="(isNightHours && !nightPushConsent) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
            >
              <div class="overflow-hidden">
                <p class="text-[13px] font-medium leading-[140%] tracking-[-0.02em] text-grey-7 text-center pb-4">
                  오후 9시~오전 8시 사이에 알림을 받으시려면<br />
                  <button class="text-[#37C58A]" @click="navigateTo('/my/terms/night-push')">야간 푸시 알림 동의</button>가 필요해요
                </p>
              </div>
            </div>

            <!-- 저장 버튼 -->
            <UiButton :disabled="!canSaveTime" @click="saveTime">저장</UiButton>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import type { ApiResponse, NotificationSetting } from '~/types/api'

definePageMeta({ middleware: 'auth', layout: 'default', hideTabBar: true })


const { $api } = useNuxtApp()
const push = usePushNotifications()
const { track } = useAmplitude()

const isLoading = ref(true)
const marketingAgreed = ref(false)
const nightPushConsent = ref(false)
const enabled = ref(false)
const reminderTime = ref<string | null>(null)

// 시간 피커 상태
const showTimePicker = ref(false)
const pickerKey = ref(0) // 열 때마다 증가시켜 피커를 강제 재마운트(항상 저장값에서 시작)

// 바텀시트 아래로 드래그해서 닫기
const dragY = ref(0)
const dragging = ref(false)
let dragStartY = 0
let closingByDrag = false

const dragStyle = computed(() => {
  if (!dragging.value && dragY.value === 0) return {}
  return {
    transform: `translateY(${dragY.value}px)`,
    transition: dragging.value ? 'none' : 'transform 0.25s ease',
  }
})

function onDragStart(e: PointerEvent) {
  dragging.value = true
  dragStartY = e.clientY
  // 포인터를 캡처해 영역을 벗어나도 move/up 이벤트가 계속 들어오게 (마우스·터치 공통)
  ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
}
function onDragMove(e: PointerEvent) {
  if (!dragging.value) return
  dragY.value = Math.max(0, e.clientY - dragStartY)
}
function onDragEnd() {
  if (!dragging.value) return
  dragging.value = false
  if (dragY.value > 90) {
    closingByDrag = true
    dragY.value = 700 // 아래로 슬라이드아웃 후 닫기
  } else {
    dragY.value = 0 // 충분히 안 내렸으면 제자리로
  }
}
function onSheetTransitionEnd(e: TransitionEvent) {
  if (e.propertyName !== 'transform') return
  if (closingByDrag) {
    closingByDrag = false
    showTimePicker.value = false
  }
}
const pickerPeriod = ref<string>('pm')
const pickerHour = ref<number>(8)
const pickerMinute = ref<number>(0)

const periodItems = [
  { value: 'am', label: '오전' },
  { value: 'pm', label: '오후' },
]
const hourItems = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: String(i + 1).padStart(2, '0'),
}))
const minuteItems = [0, 10, 20, 30, 40, 50].map(m => ({
  value: m,
  label: String(m).padStart(2, '0'),
}))

const isNightHours = computed(() => {
  let h = pickerHour.value
  if (pickerPeriod.value === 'am') {
    h = h === 12 ? 0 : h
  } else {
    h = h === 12 ? 12 : h + 12
  }
  return h >= 21 || h < 8
})

const canSaveTime = computed(() => !(isNightHours.value && !nightPushConsent.value))

const reminderTimeLabel = computed(() => {
  if (!reminderTime.value) return '오후 8:00'
  const [h, m] = reminderTime.value.split(':').map(Number)
  const period = h < 12 ? '오전' : '오후'
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${period} ${hour}:${String(m).padStart(2, '0')}`
})

function parseReminderTime(time: string) {
  const [h, m] = time.split(':').map(Number)
  pickerPeriod.value = h >= 12 ? 'pm' : 'am'
  pickerHour.value = h === 0 ? 12 : h > 12 ? h - 12 : h
  pickerMinute.value = m
}

function buildReminderTime(): string {
  let h = pickerHour.value
  if (pickerPeriod.value === 'am') {
    if (h === 12) h = 0
  } else {
    if (h !== 12) h += 12
  }
  return `${String(h).padStart(2, '0')}:${String(pickerMinute.value).padStart(2, '0')}`
}

function openTimePicker() {
  // 회고 작성 알림 동의가 꺼져 있으면 시간 설정 불가
  if (!enabled.value) return
  parseReminderTime(reminderTime.value ?? '20:00')
  dragY.value = 0 // 드래그 위치 초기화
  pickerKey.value++ // 피커 강제 재마운트 → 항상 현재 저장값에서 시작
  showTimePicker.value = true
}

async function saveTime() {
  if (!canSaveTime.value) return
  const newTime = buildReminderTime()
  reminderTime.value = newTime
  showTimePicker.value = false
  try {
    await $api.put('/api/v1/notification-settings', {
      enabled: enabled.value,
      reminderTime: newTime,
    })
    track('notification_setting_changed', { type: 'reminder_time', value: newTime })
  } catch {
    // 오류 처리
  }
}

onMounted(async () => {
  try {
    const res = await $api.get<ApiResponse<NotificationSetting>>('/api/v1/notification-settings')
    marketingAgreed.value = res.data.data.marketingAgreed
    nightPushConsent.value = res.data.data.nightPushConsent
    enabled.value = res.data.data.enabled
    reminderTime.value = res.data.data.reminderTime
  } catch {
    // 오류 처리
  } finally {
    isLoading.value = false
  }
})

async function toggleMarketing(val: boolean) {
  const prev = marketingAgreed.value
  marketingAgreed.value = val
  try {
    await $api.put('/api/v1/notification-settings/marketing-consent', { agreed: val })
    track('marketing_consent_changed', { agreed: val })
  } catch { marketingAgreed.value = prev }
}

// HH:mm 문자열이 야간(밤 9시~오전 8시)인지 판별
function isNightTime(time: string): boolean {
  const h = Number(time.split(':')[0])
  return h >= 21 || h < 8
}

// 야간 시간을 가장 가까운 낮 시간으로 보정 (밤 → 오후 8시대, 새벽 → 오전 8시대)
function clampToDayTime(time: string): string {
  const [h, m] = time.split(':')
  const hh = Number(h)
  if (hh >= 21) return `20:${m}`
  if (hh < 8) return `08:${m}`
  return time
}

async function toggleNightPush(val: boolean) {
  const prev = nightPushConsent.value
  nightPushConsent.value = val
  try {
    await $api.put('/api/v1/notification-settings/night-push-consent', { consent: val })
    track('night_push_consent_changed', { consent: val })
    // 야간 동의를 끄면, 야간으로 저장된 회고 알림 시간을 낮 시간으로 보정한다.
    // (받지 못하는 시간이 그대로 표시돼 오해를 주지 않도록)
    if (!val && reminderTime.value && isNightTime(reminderTime.value)) {
      const dayTime = clampToDayTime(reminderTime.value)
      reminderTime.value = dayTime
      await $api.put('/api/v1/notification-settings', {
        enabled: enabled.value,
        reminderTime: dayTime,
      })
    }
  } catch { nightPushConsent.value = prev }
}

async function toggleEnabled(val: boolean) {
  const prev = enabled.value
  enabled.value = val
  try {
    await $api.put('/api/v1/notification-settings', {
      enabled: val,
      reminderTime: reminderTime.value,
    })
    track('notification_setting_changed', { type: 'enabled', value: val })
    // 켤 때: 브라우저 알림 권한 요청 + FCM 토큰 발급·등록 / 끌 때: 토큰 해제(베스트에포트)
    if (val) {
      await push.register()
    } else {
      await $api.delete('/api/v1/device-tokens', { params: { deviceType: 'WEB' } }).catch(() => {})
    }
  } catch { enabled.value = prev }
}
</script>

<style scoped>
.picker-fade-enter-active { transition: opacity 0.25s ease; }
.picker-fade-leave-active { transition: opacity 0.2s ease; }
.picker-fade-enter-from,
.picker-fade-leave-to    { opacity: 0; }

.picker-slide-enter-active { transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.3s ease; }
.picker-slide-leave-active { transition: transform 0.22s ease-in, opacity 0.22s ease; }
.picker-slide-enter-from,
.picker-slide-leave-to    { transform: translateY(120%); opacity: 0; }
</style>
