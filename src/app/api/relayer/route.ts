import {createPublicClient, createWalletClient, http, parseEther} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { anvil } from 'viem/chains';
import {NextRequest, NextResponse} from 'next/server';
import {contractAddresses, HexString} from "@/config";
import {delegatedMessageStorageAbi} from "@/generated";

export async function GET() {
    return NextResponse.json({ message: 'Hello from relayer' });
}

export async function POST(request: NextRequest) {
    const body = await request.json()
    const from = body.from
    try {
    const txHash = await storeScoreOnChain(from as HexString)
    return NextResponse.json({message: 'Transaction sent successfully', data : {txHash : txHash}})
    } catch (e) {
        return NextResponse.json({ success: false, message: "Tx Failed", data:{ error : e } }, { status: 500 });
    }
}

const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Load from env for security
const RPC_URL = 'http://127.0.0.1:8545';

const account = privateKeyToAccount(PRIVATE_KEY);
const walletClient = createWalletClient({
    account,
    chain: anvil,
    transport: http(RPC_URL),
});

const publicClient = createPublicClient({
    chain: anvil,
    transport: http(RPC_URL)
})

async function sendTransaction(to : HexString) {
    return  await walletClient.sendTransaction({
        to: to,
        value: parseEther('0.01'),
        gas: BigInt(21000),
    });
}

async function storeScoreOnChain(from: HexString) {
        const { request } = await publicClient.simulateContract({
            address: contractAddresses.DelegatedMessageStorage,
            abi: delegatedMessageStorageAbi,
            functionName: "storeMessage",
            args: [from, "Hello"],
            account,
        })
    console.log(request)
        return await walletClient.writeContract(request)
}
