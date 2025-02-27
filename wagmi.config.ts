import { defineConfig } from '@wagmi/cli'
import {  react, foundry } from '@wagmi/cli/plugins'

export default defineConfig({
  out: 'src/generated.ts',
  plugins: [
    foundry({
      project: process.env.FOUNDRY_PROJECT_PATH || '../../evm/mouch-knight-contracts'
    }),
    react(),
  ],
})