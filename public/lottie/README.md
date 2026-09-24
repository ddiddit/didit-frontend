# Lottie 애니메이션

`@lottiefiles/dotlottie-vue`(`<DotLottieVue>`)가 `src`로 참조하는 정적 파일을 두는 곳.

## deep-question-loading.lottie (필요)

회고 진행 중 "심화 질문을 만들고 있어요…" 로딩 버블에서 재생.
`app/pages/retrospect/start.vue`의 `DEEP_QUESTION_LOTTIE` 상수가 이 경로를 가리킴.

- 원본: https://app.lottiefiles.com/share/42208b6a-8c77-4840-b7d6-e2bd9c8be16c
- LottieFiles에서 **Download → dotLottie(.lottie)** 받아 이 폴더에 `deep-question-loading.lottie` 이름으로 저장.
  - `.json`만 있으면 `DEEP_QUESTION_LOTTIE`를 `.json` 경로로 바꿔도 됨(dotLottie는 둘 다 지원).
  - 호스팅 URL(`https://lottie.host/xxxx.lottie`)로 교체해도 됨.
- 파일이 없으면 로티만 안 나오고 텍스트("심화 질문을 만들고 있어요…")는 정상 노출됨.

> 참고: dotLottie 플레이어는 wasm 바이너리를 런타임에 로드함. Capacitor 패키징 시 오프라인 대비가 필요하면
> `DotLottie.setWasmUrl()`로 self-host 경로를 지정할 것.
