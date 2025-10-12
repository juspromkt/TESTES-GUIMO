/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // 🔹 Novas animações customizadas
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        fadeOut: { '0%': { opacity: '1' }, '100%': { opacity: '0' } },
        slideIn: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pop: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { filter: 'drop-shadow(0 0 8px rgba(59,130,246,0.3))' },
          '50%': { filter: 'drop-shadow(0 0 16px rgba(59,130,246,0.6))' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      // 🔹 Registra as animações como classes Tailwind
      animation: {
        fadeIn: 'fadeIn 0.6s ease-out forwards',
        fadeOut: 'fadeOut 0.6s ease-out forwards',
        slideIn: 'slideIn 0.6s ease-out forwards',
        slideUp: 'slideUp 0.7s ease-out forwards',
        slideDown: 'slideDown 0.7s ease-out forwards',
        pop: 'pop 0.4s ease-out forwards',
        glowPulse: 'glowPulse 1.6s ease-in-out infinite',
        wiggle: 'wiggle 0.5s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        spinSlow: 'spin 3s linear infinite',
        spinFast: 'spin 0.6s linear infinite',
      },
      // 🔹 Efeitos de background animados e gradientes dinâmicos
      backgroundImage: {
        'gradient-glow': 'linear-gradient(90deg, #3b82f6, #6366f1, #ec4899)',
      },
      backgroundSize: {
        '200%': '200% 200%',
      },
      transitionProperty: {
        'transform-filter': 'transform, filter',
        'all': 'all',
      },
    },
  },
  variants: {
    extend: {
      // 🔹 Ativa todos os estados possíveis
      scale: ['responsive', 'hover', 'focus', 'active', 'group-hover'],
      rotate: ['hover', 'focus', 'group-hover'],
      translate: ['hover', 'focus', 'group-hover'],
      brightness: ['hover', 'focus', 'active', 'group-hover'],
      contrast: ['hover', 'focus', 'active'],
      saturate: ['hover', 'focus', 'active'],
      blur: ['hover', 'focus'],
      filter: ['hover', 'focus', 'active', 'group-hover'],
      backdropFilter: ['hover', 'focus'],
      ringWidth: ['hover', 'focus', 'active'],
      ringColor: ['hover', 'focus', 'active'],
      borderWidth: ['hover', 'focus', 'active'],
      opacity: ['hover', 'focus', 'group-hover'],
      boxShadow: ['hover', 'focus', 'group-hover'],
      transform: ['hover', 'focus', 'group-hover', 'active'],
      transitionProperty: ['responsive', 'motion-safe', 'motion-reduce'],
      animation: ['hover', 'focus', 'group-hover', 'motion-safe'],
      display: ['group-hover'],
    },
  },
  safelist: [
    // 🔹 Mantém elementos críticos do sistema
    'canvas',
    'modal',
    'tooltip',
    'dropdown',
    'sidebar',
    'glowPulse',
    'animate-fadeIn',
    'animate-slideIn',
    'animate-pop',
    'animate-glowPulse',
    'animate-wiggle',
    'hover:scale-105',
    'hover:brightness-110',
  ],
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
};
