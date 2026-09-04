<template>

    <!-- 뒤로가기 팝업 -->
    <UiPopup :modelValue="isPopupOpen" :title="'액션 확인'" :description="'뒤로가기 하시겠습니까?'" :onConfirm="confirmBack" :onCancel="cancelBack" />

    <RetroHeader :title="'건너뛰기'" :isBusy="isBusy" :onBack="onBack" />
    <div class="intro_body w-full h-[calc(100%-50px)] relative">
        <template v-if="stepIntro == 0">
            <div class="char_anime absolute top-[175px] left-0 right-0 mx-auto flex flex-col items-center">
                <img src="/chatbot_anime.gif" alt="챗봇애니메이션" class="w-[72px] h-[72px] chc_ani" />
                <p class="text-center leading-[1.7] font-bold mt-[10px] whitespace-pre-line text-[17px] text-grey-13" v-html="styledMessage" />
            </div>
            <div class="button_wrapper absolute left-0 right-0 mx-auto bottom-[60px]">
                <button class="char_anime2 w-[350px] mx-auto block bg-green py-[18px] rounded-[12px] text-grey-13 font-bold disabled:opacity-50 enabled:hover:translate-y-[-10px] transition-all duration-300" :disabled="isBusy" @click="stepIntro++">회고하는 방법 살펴보기</button>
            </div>
        </template>
        <template v-else-if="stepIntro == 1">
            <div class="char_slider pt-[114px] pb-[60px]">
                <Swiper
                    :pagination="true"
                    :modules="[Pagination]"
                    class="!flex flex-col items-center"
                    @swiper="onSwiperInit"
                    @slide-change="onSlideChange"
                >
                    <SwiperSlide class="!flex flex-col items-center">
                        <img src="/chatbot_anime_1.svg" alt="챗봇애니메이션1" class="w-50 h-50" />
                        <p class="flex flex-col items-center">
                            <b class="text-grey-13">편하게 이야기해주세요.</b>
                            <span class="text-[15px] text-grey-11">완벽하게 정리된 문장이 아니어도 괜찮아요.</span>
                        </p>
                    </SwiperSlide>
                    <SwiperSlide class="!flex flex-col items-center">
                        <img src="/chatbot_anime_1.svg" alt="챗봇애니메이션1" class="w-50 h-50" />
                        <p class="flex flex-col items-center">
                            <b class="text-grey-13">사소하고 작은 일도 좋아요.</b>
                            <span class="text-[15px] text-grey-11">작지만 의미 있는 회고가 될 수 있어요.</span>
                        </p>
                    </SwiperSlide>
                    <SwiperSlide class="!flex flex-col items-center">
                        <img src="/chatbot_anime_1.svg" alt="챗봇애니메이션1" class="w-50 h-50" />
                        <p class="flex flex-col items-center">
                            <b class="text-grey-13">텍스트,음성,파일 모두 가능해요.</b>
                            <span class="text-[15px] text-grey-11">원하는 방식으로 회고를 남겨주세요.</span>
                        </p>
                    </SwiperSlide>
                </Swiper>
            </div>
            <div class="button_wrapper">
                <button v-if="stepSlider != 3" class="w-[350px] mx-auto block bg-green py-[18px] rounded-[12px] text-grey-13 font-bold disabled:opacity-50" :disabled="isBusy" @click="goNextSlide">다음</button>
                <button v-else class="w-[350px] mx-auto block bg-green py-[18px] rounded-[12px] text-grey-13 font-bold disabled:opacity-50" :disabled="isBusy" @click="startRetrospect">첫 회고 시작하기</button>
            </div>
        </template>

    </div>
</template>
<style scoped>
    .swiper {
        --swiper-pagination-color: #191919;
    }
    :deep(.swiper-pagination) {
        position: relative;
        margin-top: 16px;
    }

    /* 애니메이션 */
    .char_anime {
        animation: chc_ani 0.5s ease-in-out;
    }
    .char_anime2 {
        animation: chc_ani2 0.5s ease-in-out;
    }
    @keyframes chc_ani {
        0% {
            transform: translateX(-100px);
            opacity: 0;
        }
        100% {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes chc_ani2 {
        0% {
            transform: translateY(40px);
            opacity: 0;
        }
        100% {
            transform: translateY(0);
            opacity: .5;
        }
    }
</style>
<script setup lang="ts">
    // 스와이퍼 임포트
    import { Swiper, SwiperSlide } from 'swiper/vue'
    import type { Swiper as SwiperInstance } from 'swiper'
    import 'swiper/css'
    import 'swiper/css/pagination'
    import  { Pagination } from 'swiper/modules'

    // 컴포넌트 임포트
    import RetroHeader from '~/components/layout/RetroHeader.vue'
import UiPopup from '~/components/ui/UiPopup.vue'

    const isBusy = ref(true) // 건너뛰기 버튼 활성화 / 비활성화 여부
    const isPopupOpen = ref(false) // 팝업 열림 여부
    const stepIntro = ref(0) // 인트로 스텝
    const stepSlider = ref(1) // 슬라이더 스텝 (1-base, 현재 활성 슬라이드 번호)

    // goBack 버튼 클릭 시 팝업 이동
    function onBack() {
        isPopupOpen.value = true
    }

    // 팝업에서 취소 클릭 시 돌아가기
    function cancelBack() {
        isPopupOpen.value = false
    }

    // 팝업에서 확인 클릭 시 뒤로가기
    function confirmBack() {
        navigateTo('/home')
    }

    // Swiper 인스턴스 참조 — 버튼 클릭으로 슬라이드 이동시키기 위해 보관
    const swiperInstance = ref<SwiperInstance | null>(null)

    function onSwiperInit(swiper: SwiperInstance) {
        swiperInstance.value = swiper
    }

    // 슬라이드가 바뀔 때마다 stepSlider 동기화 (activeIndex는 0-base라 +1)
    function onSlideChange(swiper: SwiperInstance) {
        stepSlider.value = swiper.activeIndex + 1
    }

    // '다음' 버튼: 인트로 스텝이 아니라 슬라이더 자체를 한 칸 넘김
    function goNextSlide() {
        swiperInstance.value?.slideNext()
    }

    // 첫 회고 시작하기
    function startRetrospect() {
        navigateTo('/retrospect/start')
    }

    // 사용자 정보 전역 상태
    const { load, profile } = useProfile()

    // 타이핑 애니메이션으로 한 글자씩 채워지는 인사말 (템플릿에 바인딩)
    const plusMessage = ref('')

    // 강조할 문구 — 이 부분만 다른 스타일 적용
    const HIGHLIGHT = '회고 파트너 디딧이'

    // plusMessage 안에서 강조 문구를 <span>으로 감싸 v-html로 렌더
    const styledMessage = computed(() =>
        plusMessage.value.replace(
            HIGHLIGHT,
            `<span class="text-green-active">${HIGHLIGHT}</span>`,
        ),
    )

    // 타이머 참조 — 컴포넌트 언마운트 시 정리
    let typingInterval: ReturnType<typeof setInterval> | null = null

    // message 를 delay 간격으로 한 글자씩 plusMessage 에 누적
    function typeMessage(message: string, delay: number = 50) {
        plusMessage.value = ''
        isBusy.value = true
        let index = 0
        typingInterval = setInterval(() => {
            plusMessage.value += message[index]
            index++
            if (index >= message.length && typingInterval) {
                clearInterval(typingInterval)
                typingInterval = null
                isBusy.value = false
            }
        }, delay)
    }

    onMounted(async () => {
        await load() // 사용자 정보 로드
        const message = `${profile.value?.nickname}님, 안녕하세요!\n저는 회고 파트너 디딧이에요.\n앞으로 회고를 도와드릴게요.`
        typeMessage(message)
    })

    onUnmounted(() => {
        if (typingInterval) clearInterval(typingInterval)
    })

</script>