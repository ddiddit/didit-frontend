// 회고 답변 첨부파일 — 지원 포맷/용량 검증, 업로드 URL 발급 요청에 필요한 체크섬 계산.

// 지원 확장자 → MIME. 브라우저가 File.type을 못 채워주는 경우(특히 .md)를 대비해
// 확장자 기준으로 직접 판정/보정한다.
const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  pdf: 'application/pdf',
  txt: 'text/plain',
  md: 'text/markdown',
}

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024 // 파일당 10MB
export const MAX_ATTACHMENT_COUNT = 3 // 답변당 최대 3개

function extOf(filename: string): string {
  return filename.slice(filename.lastIndexOf('.') + 1).toLowerCase()
}

// 지원하는 확장자인지 (jpg/png/pdf/txt/md)
export function isSupportedAttachment(file: File): boolean {
  return extOf(file.name) in MIME_BY_EXT
}

// 업로드 URL 발급 요청에 실어 보낼 contentType — File.type이 비어있으면(.md 등) 확장자로 보정
export function resolveContentType(file: File): string {
  return file.type || MIME_BY_EXT[extOf(file.name)] || 'application/octet-stream'
}

// 파일 본문의 SHA-256을 base64로 인코딩 — 업로드 URL 발급 요청의 checksumSha256
export async function sha256Base64(file: Blob): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const bytes = new Uint8Array(hashBuffer)
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary)
}
