<template>
  <!--
    스크롤 콘텐츠가 상단으로 사라질 때 흰색 그라데이션 페이드.
    스크롤 컨테이너(블록 플로우)의 첫 자식으로 넣어 사용한다.
    sticky로 스크롤 최상단에 고정되고, 음수 margin으로 레이아웃 공간은 차지하지 않는다.
  -->
  <div
    class="sticky top-0 z-10 h-7 -mb-7 pointer-events-none bg-gradient-to-b from-white to-transparent"
    aria-hidden="true"
  />
</template>
