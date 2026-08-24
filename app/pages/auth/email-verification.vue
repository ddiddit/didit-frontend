<template>
  <main class="min-h-dvh bg-white px-5 safe-bottom">
    <div class="mx-auto flex min-h-dvh w-full max-w-md flex-col pt-6">
      <button class="mb-10 flex h-10 w-10 items-center justify-center" aria-label="로그인으로 돌아가기" @click="goBack">
        <Icon name="material-symbols:arrow-back-ios-new-rounded" class="h-5 w-5 text-grey-9" />
      </button>

      <template v-if="step === 'email'">
        <h1 class="text-title1 font-bold text-grey-10">이메일을 인증해주세요</h1>
        <p class="mt-3 text-body2 leading-6 text-grey-7">
          기존 디딧 데이터와 안전하게 연결하기 위해<br>
          사용 중인 이메일로 인증번호를 보내드려요.
        </p>
        <p v-if="pending?.emailHint" class="mt-2 text-caption1 text-grey-6">
          소셜 계정 이메일: {{ pending.emailHint }}
        </p>

        <label class="mt-10 text-label1 font-medium text-grey-9" for="recovery-email">이메일</label>
        <input
          id="recovery-email"
          v-model.trim="email"
          type="email"
          inputmode="email"
          autocomplete="email"
          placeholder="example@email.com"
          class="mt-2 h-14 rounded-xl border border-grey-3 px-4 text-body2 outline-none focus:border-grey-9"
          @keyup.enter="sendCode"
        >
        <p v-if="errorMessage" class="mt-2 text-caption1 text-red-500">{{ errorMessage }}</p>

        <button
          class="mt-auto h-14 w-full rounded-xl bg-grey-10 text-body2 font-semibold text-white disabled:opacity-40"
          :disabled="isLoading || !isEmailValid"
          @click="sendCode"
        >
          {{ isLoading ? '보내는 중...' : '인증번호 받기' }}
        </button>
      </template>

      <template v-else>
        <h1 class="text-title1 font-bold text-grey-10">인증번호를 입력해주세요</h1>
        <p class="mt-3 text-body2 leading-6 text-grey-7">
          {{ email }}로 보낸 6자리 번호를 입력해주세요.
        </p>

        <label class="mt-10 text-label1 font-medium text-grey-9" for="verification-code">인증번호</label>
        <input
          id="verification-code"
          v-model="code"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          maxlength="6"
          placeholder="000000"
          class="mt-2 h-14 rounded-xl border border-grey-3 px-4 text-center text-xl font-semibold tracking-[0.4em] outline-none focus:border-grey-9"
          @input="code = code.replace(/\D/g, '').slice(0, 6)"
          @keyup.enter="verifyCode"
        >
        <div class="mt-3 flex items-center justify-between text-caption1">
          <span :class="remainingSeconds > 0 ? 'text-grey-6' : 'text-red-500'">
            {{ remainingSeconds > 0 ? formatRemainingTime(remainingSeconds) : '인증번호가 만료되었어요.' }}
          </span>
          <button class="font-medium text-grey-9 disabled:text-grey-4" :disabled="isLoading || resendCooldown > 0" @click="sendCode">
            {{ resendCooldown > 0 ? `${resendCooldown}초 후 재전송` : '다시 받기' }}
          </button>
        </div>
        <p v-if="errorMessage" class="mt-3 text-caption1 text-red-500">{{ errorMessage }}</p>

        <button
          class="mt-auto h-14 w-full rounded-xl bg-grey-10 text-body2 font-semibold text-white disabled:opacity-40"
          :disabled="isLoading || code.length !== 6 || remainingSeconds <= 0"
          @click="verifyCode"
        >
          {{ isLoading ? '확인 중...' : '인증하고 계속하기' }}
        </button>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { getApiErrorCode, getApiErrorMessage } from '~/utils/api-error'

definePageMeta({ layout: false })

const flow = useSocialLoginFlow()
const pending = ref(flow.getPendingLogin())
const step = ref<'email' | 'code'>('email')
const email = ref('')
const code = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const remainingSeconds = ref(0)
const resendCooldown = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const isEmailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value))

onMounted(() => {
  pending.value = flow.getPendingLogin()
  if (!pending.value) navigateTo('/login', { replace: true })
  timer = setInterval(() => {
    if (remainingSeconds.value > 0) remainingSeconds.value--
    if (resendCooldown.value > 0) resendCooldown.value--
  }, 1000)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})

async function sendCode() {
  if (!isEmailValid.value || isLoading.value) return
  isLoading.value = true
  errorMessage.value = ''
  try {
    const result = await flow.startEmailVerification(email.value)
    remainingSeconds.value = result.expiresInSeconds
    resendCooldown.value = 60
    code.value = ''
    step.value = 'code'
  }
  catch (error) {
    handleSessionError(error)
    errorMessage.value = getApiErrorMessage(error, '인증번호를 보내지 못했어요. 다시 시도해주세요.')
  }
  finally {
    isLoading.value = false
  }
}

async function verifyCode() {
  if (code.value.length !== 6 || isLoading.value) return
  isLoading.value = true
  errorMessage.value = ''
  try {
    await flow.verifyEmail(code.value)
  }
  catch (error) {
    handleSessionError(error)
    errorMessage.value = getApiErrorMessage(error, '인증에 실패했어요. 다시 시도해주세요.')
  }
  finally {
    isLoading.value = false
  }
}

function handleSessionError(error: unknown) {
  const code = getApiErrorCode(error)
  if (
    code === 'SOCIAL_LOGIN_SESSION_INVALID'
    || code === 'SOCIAL_LOGIN_SESSION_EXPIRED'
    || code === 'EMAIL_VERIFICATION_ATTEMPTS_EXCEEDED'
  ) {
    flow.clearPendingLogin()
  }
}

function formatRemainingTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}:${String(rest).padStart(2, '0')}`
}

function goBack() {
  flow.clearPendingLogin()
  navigateTo('/login', { replace: true })
}
</script>
