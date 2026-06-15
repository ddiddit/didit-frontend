import type { Config } from 'tailwindcss'
import { primary, neutral, tag, system } from './app/utils/colors'

export default {
  content: [
    './app/**/*.{vue,ts}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Primary (= 피그마 Primary/50)
        primary: primary[50],

        // Green 팔레트 (피그마 Primary Color 전체)
        green: {
          light:          primary[10],
          'light-hover':  primary[20],
          'light-active': primary[30],
          DEFAULT:        primary[50],
          hover:          primary[55],
          active:         primary[60],
          dark:           primary[70],
          'dark-hover':   primary[80],
          'dark-active':  primary[90],
          darker:         primary[95],
        },

        // Grey 팔레트 (피그마 Neutral Color, 1=밝음~13=어두움)
        grey: {
          '1':  neutral[0],
          '2':  neutral[5],
          '3':  neutral[10],
          '4':  neutral[20],
          '5':  neutral[30],
          '6':  neutral[40],
          '7':  neutral[50],
          '8':  neutral[60],
          '9':  neutral[70],
          '10': neutral[80],
          '11': neutral[90],
          '12': neutral[95],
          '13': neutral[100],
        },

        // Tag 팔레트 (피그마 Tag Color)
        tag,

        // System 팔레트 (피그마 System Color)
        danger: {
          DEFAULT: system.danger60,
          '50':    system.danger50,
          '60':    system.danger60,
        },
        accent: system.accent50,

        // 편의 별칭
        error:      system.danger60,
        surface:    neutral[0],
        background: neutral[10],
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
        card:   '0 2px 12px rgba(0,0,0,0.06)',
        bottom: '0 -2px 12px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
} satisfies Config
