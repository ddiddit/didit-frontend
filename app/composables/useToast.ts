const visible = ref(false)
const message = ref('')
const withIcon = ref(true) // notice(경고) 아이콘 표시 여부 — 기본 표시, 성공 토스트 등은 끌 수 있음
let timer: ReturnType<typeof setTimeout> | null = null

export function useToast() {
  // opts: 숫자면 duration(하위 호환), 객체면 { duration, icon }
  function show(text: string, opts: number | { duration?: number, icon?: boolean } = {}) {
    const o = typeof opts === 'number' ? { duration: opts } : opts
    if (timer) clearTimeout(timer)
    message.value = text
    withIcon.value = o.icon ?? false
    visible.value = true
    timer = setTimeout(() => { visible.value = false }, o.duration ?? 2500)
  }

  return { visible: readonly(visible), message: readonly(message), withIcon: readonly(withIcon), show }
}
