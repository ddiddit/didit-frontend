import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    // 하단 탭바 숨김 여부 (마이페이지 하위 상세 등)
    hideTabBar?: boolean
  }
}

export {}
