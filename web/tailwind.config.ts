import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Romantic, warm palette
        rose: {
          50: '#FDF2F4',
          100: '#FCE7EB',
          200: '#F8CFD8',
          300: '#F3ADB8',
          400: '#EE8A9E',
          500: '#D4567C',  // Primary romantic rose
          600: '#B8446A',
          700: '#9C3358',
          800: '#802747',
          900: '#641D38',
        },
        cream: {
          50: '#FDFBFA',
          100: '#FAF7F5',
          200: '#F8F3F0',
          300: '#F5EFEA',
          400: '#F2EBE4',
          500: '#F0E8DF',  // Warm background
          600: '#EDE3D8',
          700: '#EAE0D1',
          800: '#E6DDCA',
          900: '#E3D9C3',
        },
        amethyst: {
          50: '#F5F0FA',
          100: '#EBE3F5',
          200: '#D8C9EB',
          300: '#C5AFE0',
          400: '#B295D6',
          500: '#9B76C9',
          600: '#7B3F8E',  // Rich amethyst
          700: '#64337A',
          800: '#4D2966',
          900: '#361F52',
        },
        gold: {
          50: '#FDF9F3',
          100: '#FAF2E8',
          200: '#F5E6D2',
          300: '#F0D9BC',
          400: '#ECCBA6',
          500: '#D4A574',  // Soft gold accent
          600: '#C9955C',
          700: '#BE8644',
          800: '#B3772C',
          900: '#A86814',
        },
        ink: {
          950: '#1A1A1E',  // Almost black
          900: '#2D2A2E',  // Soft black
          800: '#403C42',
          700: '#534E56',
        },
      },
      fontFamily: {
        // Distinctive, elegant typography
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'serif'],
        accent: ['var(--font-accent)', 'serif'],
      },
      fontSize: {
        'display-xl': ['clamp(3rem, 8vw, 6rem)', { lineHeight: '0.95', letterSpacing: '-0.03em' }],
        'display-lg': ['clamp(2.5rem, 6vw, 4.5rem)', { lineHeight: '1', letterSpacing: '-0.02em' }],
        'display-md': ['clamp(2rem, 4vw, 3rem)', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
        'display-sm': ['clamp(1.5rem, 3vw, 2.25rem)', { lineHeight: '1.2', letterSpacing: '-0.005em' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
        '34': '8.5rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'mesh': 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%220.05%22/%3E%3C/svg%3E")',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 3s infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}

export default config
