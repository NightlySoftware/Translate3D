import type {Config} from 'tailwindcss';

/**
 * Tailwind v4 is configured CSS-first in `app/styles/tailwind.css`.
 * This file exists to keep shadcn/ui tooling happy and for future plugins.
 */
export default {
  content: ['./app/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
