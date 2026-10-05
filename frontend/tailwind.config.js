/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        night: {
          500: '#5d5189',
          600: '#44386b',
          700: '#30254f',
          800: '#241b3f',
          900: '#1a1330',
          950: '#120d1f',
        },
        fog: {
          200: '#ddd8ef',
          300: '#bdb7d4',
          400: '#9a93b5',
        },
        parchment: {
          100: '#fbf2dc',
          200: '#f1e2bd',
          300: '#e3cc94',
        },
        ink: '#3b2a1a',
        torch: {
          300: '#ffd37a',
          400: '#f5b041',
          500: '#e8912d',
          600: '#c46f1c',
        },
        jade: {
          400: '#6cd47e',
          600: '#3b9c4f',
        },
        ruby: {
          400: '#f0716a',
          600: '#c7423a',
        },
        mana: {
          400: '#6ec3f2',
          600: '#3c8fc4',
        },
        gold: '#ffcf3f',
        outline: '#0b0814',
      },
      fontFamily: {
        ui: ['"Pixelify Sans"', 'system-ui', 'sans-serif'],
        display: ['"Press Start 2P"', 'monospace'],
        read: ['"Atkinson Hyperlegible"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // The root size is 18px, so the default 0.75rem would drop below 14px.
        xs: ['0.8rem', { lineHeight: '1.15rem' }],
      },
      borderWidth: {
        3: '3px',
      },
    },
  },
  plugins: [],
};
