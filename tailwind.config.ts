import type { Config } from 'tailwindcss'
import flowbite from 'flowbite-react/tailwind'

export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    flowbite.content(),
  ],
  theme: {
    extend: {},
  },
  plugins: [
    flowbite.plugin(),
  ],
} satisfies Config