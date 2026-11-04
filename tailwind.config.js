/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        secondary: 'var(--color-secondary)',
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        'surface-2': 'var(--color-surface-2)',
        line: 'var(--color-border)',
        ink: 'var(--color-text-primary)',
        muted: 'var(--color-text-secondary)',
        'on-primary': 'var(--color-on-primary)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)'
      },
      borderRadius: { card: 'var(--card-radius)', btn: 'var(--btn-radius)' },
      fontFamily: { display: 'var(--font-display)', body: 'var(--font-body)' }
    }
  },
  plugins: []
};
