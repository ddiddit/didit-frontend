// 음성 업로드 포맷 보정.
// 백엔드가 받는 포맷: wav / m4a / mp3 / aac / ac3 / ogg / flac.
// 웹 MediaRecorder는 보통 webm/opus(크롬)로 녹음하는데 이는 미지원이라 wav로 변환한다.
// 네이티브(또는 사파리 mp4 / 파이어폭스 ogg)처럼 이미 지원 포맷이면 변환 없이 그대로 업로드한다.

// MIME → 확장자 (지원 포맷만)
const SUPPORTED_MIME_EXT: Record<string, string> = {
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/mp4': 'm4a',
  'audio/m4a': 'm4a',
  'audio/aac': 'aac',
  'audio/ac3': 'ac3',
  'audio/mpeg': 'mp3',
  'audio/ogg': 'ogg',
  'audio/flac': 'flac',
}

// 업로드 가능한 {blob, filename}을 만든다. 미지원 포맷이면 wav로 변환.
export async function toUploadableAudio(blob: Blob): Promise<{ blob: Blob; filename: string }> {
  const mime = (blob.type || '').split(';')[0].toLowerCase()
  const ext = SUPPORTED_MIME_EXT[mime]
  if (ext) return { blob, filename: `voice.${ext}` }
  const wav = await blobToWav(blob)
  return { blob: wav, filename: 'voice.wav' }
}

// 임의 오디오 Blob → 16bit PCM WAV (Web Audio API 디코딩 기반, 의존성 없음)
async function blobToWav(blob: Blob): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer()
  const Ctx =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) throw new Error('AudioContext를 지원하지 않는 브라우저입니다.')
  const ctx = new Ctx()
  try {
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
    return encodeWav(audioBuffer)
  } finally {
    await ctx.close()
  }
}

function encodeWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const numFrames = buffer.length

  // 채널 인터리브
  const interleaved = new Float32Array(numFrames * numChannels)
  for (let ch = 0; ch < numChannels; ch++) {
    const data = buffer.getChannelData(ch)
    for (let i = 0; i < numFrames; i++) interleaved[i * numChannels + ch] = data[i]
  }

  const bytesPerSample = 2 // 16bit
  const dataSize = interleaved.length * bytesPerSample
  const view = new DataView(new ArrayBuffer(44 + dataSize))

  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i))
  }

  // RIFF 헤더
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeStr(8, 'WAVE')
  // fmt 청크
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true) // 청크 길이
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true) // byte rate
  view.setUint16(32, numChannels * bytesPerSample, true) // block align
  view.setUint16(34, 16, true) // bits per sample
  // data 청크
  writeStr(36, 'data')
  view.setUint32(40, dataSize, true)

  // 16bit PCM 샘플 기록
  let offset = 44
  for (let i = 0; i < interleaved.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, interleaved[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }

  return new Blob([view], { type: 'audio/wav' })
}
