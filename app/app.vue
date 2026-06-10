<template>
  <!-- 데스크탑: 회색 배경 위에 두 패널이 가운데 정렬 -->
  <div class="min-h-dvh bg-background desktop:bg-white desktop:flex desktop:justify-center desktop:items-start">
    <NuxtRouteAnnouncer />

    <!-- 두 패널 묶음 -->
    <div class="flex min-h-dvh">

      <!-- 왼쪽 랜딩 패널 (980px 이상) -->
      <aside
        class="hidden desktop:flex flex-col justify-center
               w-[440px] flex-shrink-0 min-h-dvh
               bg-white border-r border-gray-100 p-10 gap-10"
      >
        <div>
          <!-- 로고 -->
          <div class="flex items-center gap-2.5 mb-10">
            <img src="/icon.png" alt="didit" class="w-9 h-9 rounded-[9px]" />
            <span class="text-[22px] font-bold text-gray-900 tracking-tight">didit</span>
          </div>

          <!-- 헤드라인 -->
          <h1 class="text-[28px] font-bold text-gray-900 leading-snug tracking-tight mb-3">
            AI와 함께하는<br>더 깊은 업무 회고
          </h1>
          <p class="text-[15px] text-gray-400 leading-relaxed mb-10">
            하루의 업무를 기록하면 AI가<br>깊이 있는 질문으로 성장을 도와드립니다.
          </p>

          <!-- 특징 -->
          <ul class="space-y-3">
            <li
              v-for="feature in features"
              :key="feature"
              class="flex items-center gap-3 text-[14px] text-gray-600"
            >
              <span
                class="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style="background-color: rgba(61,219,153,0.15);"
              >
                <span class="text-primary font-bold" style="font-size: 9px;">✓</span>
              </span>
              {{ feature }}
            </li>
          </ul>
        </div>

        <!-- QR 코드 -->
        <div class="bg-gray-50 rounded-2xl p-5 flex items-center gap-4">
          <img
            src="/qr-appstore.png"
            alt="App Store 다운로드 QR 코드"
            class="w-[88px] h-[88px] flex-shrink-0"
          />
          <div>
            <p class="text-[11px] text-gray-400 mb-0.5">카메라로 스캔하세요</p>
            <p class="text-[14px] font-semibold text-gray-900">iOS 앱 설치하기</p>
            <a
              href="https://apps.apple.com/kr/app/%EB%94%94%EB%94%A7-didit-ai-%EC%97%85%EB%AC%B4-%ED%9A%8C%EA%B3%A0/id6761548843"
              target="_blank"
              rel="noopener noreferrer"
              class="text-[12px] text-primary mt-1 block hover:underline"
            >
              App Store 바로가기 →
            </a>
            <p class="text-[11px] text-gray-300 mt-0.5">Android 버전 출시 예정</p>
          </div>
        </div>
      </aside>

      <!-- 앱 영역: 모바일=흰 배경 전체화면, 데스크탑=390px 흰 패널+그림자 -->
      <div
        class="w-full max-w-[390px] mx-auto desktop:max-w-none desktop:mx-0 desktop:w-[390px] desktop:flex-shrink-0 h-dvh overflow-hidden flex flex-col bg-background"
        style="box-shadow: 0 2px 4px rgba(0,0,0,0.04), 0 8px 16px rgba(0,0,0,0.06), 0 24px 48px rgba(0,0,0,0.08);"
      >
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
const features = [
  'AI 심화 질문으로 더 깊은 성찰',
  '프로젝트·태그로 체계적인 회고 관리',
  '스트릭·배지로 꾸준한 성장 확인',
]
</script>
