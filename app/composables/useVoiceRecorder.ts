// 음성 녹음 (네이티브 전용 — 웹에선 음성 버튼 자체가 노출되지 않음).
//
// ⚠️ 지금은 Capacitor 미설치 상태라 웹 MediaRecorder로 뼈대만 구현해둔다.
// Capacitor 패키징 시 아래 TODO대로 네이티브 레코더 플러그인으로 교체해야 한다:
//   - 웹 MediaRecorder 출력은 보통 webm/opus → 백엔드 /answers/voice 가 받는 포맷(wav/m4a/mp3/aac/ac3/ogg/flac)이 아님
//   - 따라서 실기기에선 @capacitor-community/voice-recorder 등으로 녹음해 m4a/wav 파일을 만들어 업로드
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
    } catch {
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
