import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{vue,ts}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['PretendardVariable', 'Pretendard', 'system-ui', 'sans-serif'],
      },
      colors: {
        // 피그마 Primary (= Green/Normal)
        primary: '#3DDB99',

        // 피그마 Neutral/grey (1=밝음 ~ 13=어두움)
        grey: {
          '1':  '#FFFFFF',
          '2':  '#FDFDFD',
          '3':  '#F6F6F6',
          '4':  '#F1F1F1',
          '5':  '#E6E6E6',
          '6':  '#C6C6C6',
          '7':  '#989898',
          '8':  '#6A6A6A',
          '9':  '#575757',
          '10': '#3C3C3C',
          '11': '#353535',
          '12': '#2B2B2B',
          '13': '#191919',
        },

        // 피그마 Green (상태별 전체 팔레트)
        green: {
          light:          '#ECFBF5',
          'light-hover':  '#E2FAF0',
          'light-active': '#C3F4DF',
          DEFAULT:        '#3DDB99',
          hover:          '#37C58A',
          active:         '#31AF7A',
          dark:           '#2EA473',
          'dark-hover':   '#25835C',
          'dark-active':  '#1B6345',
          darker:         '#154D36',
        },

        // 피그마 Tag 색상 팔레트
        tag: {
          green:            '#37C58A',
          'green-light':    '#E2FAF0',
          pink:             '#E079E0',
          'pink-light':     '#FAEBFA',
          blue:             '#5A8DEE',
          'blue-light':     '#E6EEFC',
          orange:           '#F08A5D',
          'orange-light':   '#FDEDE7',
          purple:           '#8C7CF0',
          'purple-light':   '#EEEBFD',
          yellow:           '#DEAD3A',
          'yellow-light':   '#FAF3E1',
          red:              '#F06C6C',
          'red-light':      '#FDECEC',
          'leaf-green':     '#77C767',
          'leaf-green-light':'#EBF7E8',
          'sky-blue':       '#65ABE0',
          'sky-blue-light': '#E8F2FA',
          brown:            '#C78B5C',
          'brown-light':    '#F7EEE7',
        },

        // 기존 gray — 점진적으로 grey로 마이그레이션 예정
        gray: {
          '50':  '#F9FAFB',
          '100': '#F3F4F6',
          '200': '#E5E7EB',
          '300': '#D1D5DB',
          '400': '#9CA3AF',
          '500': '#6B7280',
          '600': '#4B5563',
          '700': '#374151',
          '800': '#1F2937',
          '900': '#111827',
        },

        surface: '#FFFFFF',
        background: '#F6F6F6',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      screens: {
        xs: '375px',
        sm: '390px',
        desktop: '980px',
      },
      maxWidth: {
        mobile: '390px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.06)',
        bottom: '0 -2px 12px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
} satisfies Config
