// 음성 녹음 — 웹·네이티브 공통. 웹은 브라우저 MediaRecorder로 녹음한다.
// 웹 MediaRecorder 출력은 보통 webm/opus라 백엔드가 받는 포맷이 아니지만,
// 업로드 직전 toUploadableAudio(app/utils/audio.ts)에서 WAV로 변환해 전송한다.
//
// Capacitor 패키징 시 네이티브 레코더 플러그인으로 교체하면 더 좋다:
//   - @capacitor-community/voice-recorder 등으로 m4a/wav를 직접 녹음해 변환 없이 업로드
//   - 마이크 권한도 Capacitor Permissions / 네이티브 권한 다이얼로그로 처리
export function useVoiceRecorder() {
  const isRecording = ref(false)
  const isPaused = ref(false)
  const elapsed = ref(0) // 녹음 경과(초)

  let mediaRecorder: MediaRecorder | null = null
  let stream: MediaStream | null = null
  let chunks: BlobPart[] = []
  let timer: ReturnType<typeof setInterval> | null = null

  function startTimer() {
    timer = setInterval(() => {
      elapsed.value += 1
    }, 1000)
  }
  function stopTimer() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  function pause() {
    if (mediaRecorder?.state === 'recording') {
      mediaRecorder.pause()
      isPaused.value = true
      stopTimer()
    }
  }
  function resume() {
    if (mediaRecorder?.state === 'paused') {
      mediaRecorder.resume()
      isPaused.value = false
      startTimer()
    }
  }

  // 마이크 권한 요청 (성공 시 true). 네이티브에선 권한 다이얼로그로 대체.
  async function requestPermission(): Promise<boolean> {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true })
      // 권한 확인만 하고 트랙은 정리 (실제 녹음은 start에서 다시 잡음)
      s.getTracks().forEach((t) => t.stop())
      return true
    } catch {
      return false
    }
  }

  async function start(): Promise<boolean> {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunks = []
      mediaRecorder = new MediaRecorder(stream)
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }
      mediaRecorder.start()
      isRecording.value = true
      isPaused.value = false
      elapsed.value = 0
      startTimer()
      return true
    } catch (e) {
      console.warn('[voice] 녹음 시작 실패(마이크 권한/장치 확인):', e)
      cleanup()
      return false
    }
  }

  // 녹음 종료 → 오디오 Blob 반환
  function stop(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const mr = mediaRecorder
      if (!mr || mr.state === 'inactive') {
        cleanup()
        resolve(null)
        return
      }
      mr.onstop = () => {
        const blob = chunks.length ? new Blob(chunks, { type: mr.mimeType || 'audio/webm' }) : null
        cleanup()
        resolve(blob)
      }
      mr.stop()
    })
  }

  function cancel() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.onstop = null
      mediaRecorder.stop()
    }
    cleanup()
  }

  function cleanup() {
    stopTimer()
    stream?.getTracks().forEach((t) => t.stop())
    stream = null
    mediaRecorder = null
    chunks = []
    isRecording.value = false
    isPaused.value = false
  }

  onUnmounted(cancel)

  return {
    isRecording: readonly(isRecording),
    isPaused: readonly(isPaused),
    elapsed: readonly(elapsed),
    requestPermission,
    start,
    stop,
    pause,
    resume,
    cancel,
  }
}
