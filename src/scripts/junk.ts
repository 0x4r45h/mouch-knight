import { createPublicClient, http } from 'viem'
import { anvil } from 'viem/chains'
import {getPublicClientByChainId} from "@/config";

const client = createPublicClient({
    chain: anvil,
    transport: http('http://127.0.0.1:8545', {
        onFetchRequest(request, init) {
            console.log('Request:', request);
            console.log('init:', init);
        },
        batch: false,
    }),
})

export default async function main() {
    const pubClient = getPublicClientByChainId(10143);
    const pubClientAnvil = getPublicClientByChainId(31337);
    const res = await pubClient.getChainId();
    console.log(res);
    console.log(await pubClientAnvil.getChainId());
    await junk();
    return
}

async function junk() {
    const [blockNumber, maxPriorityFeePerGas, feesPerGas, balance1, balance2, balance3] = await Promise.all([
        client.getBlockNumber(),
        client.estimateMaxPriorityFeePerGas(),
        client.estimateFeesPerGas(),
        client.getBalance({ address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' }),
        client.getBalance({ address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' }),
        client.getBalance({ address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' }),
    ])
    console.log(blockNumber, maxPriorityFeePerGas, feesPerGas, balance1, balance2, balance3);
}