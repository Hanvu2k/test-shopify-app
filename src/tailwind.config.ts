import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './client/**/*.{ts,tsx,html}',
  ],
  theme: {
    extend: {
      colors: {
        // Developer-tool dark theme palette (VS Code / Postman inspired)
        surface: {
          DEFAULT: '#1e1e1e',
          raised: '#252526',
          overlay: '#2d2d30',
          inset: '#1a1a1a',
        },
        border: {
          DEFAULT: '#3e3e42',
          focus: '#007fd4',
        },
        text: {
          primary: '#d4d4d4',
          secondary: '#9d9d9d',
          muted: '#6e6e6e',
          accent: '#4fc1ff',
          success: '#4ec9b0',
          warning: '#ce9178',
          error: '#f44747',
        },
        brand: {
          DEFAULT: '#007fd4',
          hover: '#1b8fe0',
          active: '#006db5',
        },
        status: {
          pass: '#4ec9b0',
          fail: '#f44747',
          running: '#dcdcaa',
          idle: '#6e6e6e',
        },
      },
      fontFamily: {
        mono: ['Consolas', 'Monaco', 'Cascadia Code', 'Fira Code', 'monospace'],
        sans: ['Segoe UI', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: ['11px', { lineHeight: '16px' }],
        sm: ['12px', { lineHeight: '18px' }],
        base: ['13px', { lineHeight: '20px' }],
        md: ['14px', { lineHeight: '22px' }],
      },
    },
  },
  plugins: [],
};

export default config;
