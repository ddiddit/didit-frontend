const visible = ref(false)
const message = ref('')
let timer: ReturnType<typeof setTimeout> | null = null

export function useToast() {
  function show(text: string, duration = 2500) {
    if (timer) clearTimeout(timer)
    message.value = text
    visible.value = true
    timer = setTimeout(() => { visible.value = false }, duration)
  }

  return { visible: readonly(visible), message: readonly(message), show }
}
