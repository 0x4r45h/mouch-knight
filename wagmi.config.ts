import { defineConfig } from '@wagmi/cli'
import {  react, foundry } from '@wagmi/cli/plugins'
import { erc20Abi } from 'viem'

export default defineConfig({
  out: 'src/generated.ts',
  contracts: [
    {
      name: 'erc20',
      abi: erc20Abi,
    },
  ],
  plugins: [
    foundry({
      project: process.env.FOUNDRY_PROJECT_PATH || '../../evm/mouch-knight-contracts'
    }),
    react(),
  ],
})