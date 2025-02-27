import type { Config } from 'tailwindcss'
import flowbite from 'flowbite-react/tailwind'

export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    flowbite.content(),
  ],
  theme: {
    extend: {
      colors: {
        // Role-based colors
        'background': '#FBFAF9', // default background
        'text': '#0E100F', // default text color
        'primary': '#836EF9', // main action color
        'secondary': '#200052', // secondary action color
        'accent': '#A0055D', // accent color
        'dark-background': '#200052', // for dark-themed sections
        'light-text': '#FBFAF9', // text color on dark background
        'white': '#FFFFFF',

        // Brand colors
        'monad-off-white': '#FBFAF9',
        'monad-purple': '#836EF9',
        'monad-blue': '#200052',
        'monad-berry': '#A0055D',
        'monad-black': '#0E100F',
      },
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [
    flowbite.plugin(),
  ],
} satisfies Config