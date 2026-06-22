import type { ApiResponse, Project, Tag } from '~/types/api'

// 프로젝트 / 태그 CRUD (회고 결과·상세에서 프로젝트·태그 지정 시 사용)
export function useOrganization() {
  const { $api } = useNuxtApp()

  async function listProjects(): Promise<Project[]> {
    const res = await $api.get<ApiResponse<Project[]>>('/api/v1/projects')
    return res.data.data
  }

  // 프로젝트 생성 (최대 15자). 백엔드는 204(No Content)라 응답 바디 없음 → 생성 후 목록 재조회 필요.
  async function createProject(name: string): Promise<void> {
    await $api.post('/api/v1/projects', { name })
  }

  async function listTags(): Promise<Tag[]> {
    const res = await $api.get<ApiResponse<Tag[]>>('/api/v1/tags')
    return res.data.data
  }

  // 태그 생성 (1~10자) → 생성된 태그
  async function createTag(name: string): Promise<Tag> {
    const res = await $api.post<ApiResponse<Tag>>('/api/v1/tags', { name })
    return res.data.data
  }

  // 태그 완전 삭제 (연결된 모든 회고에서 제거됨)
  async function deleteTag(id: string): Promise<void> {
    await $api.delete(`/api/v1/tags/${id}`)
  }

  return { listProjects, createProject, listTags, createTag, deleteTag }
}
