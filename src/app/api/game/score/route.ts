import {createPublicClient, createWalletClient, http} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { anvil } from 'viem/chains';
import {NextRequest, NextResponse} from 'next/server';
import {contractAddresses, HexString} from "@/config";
import { scoreManagerAbi} from "@/generated";

export async function GET() {
    return NextResponse.json({ message: 'Hello from relayer' });
}

export async function POST(request: NextRequest) {
    // TODO : prevent reply attacks
    const body = await request.json()
    const player = body.player
    const sessionId = body.session_id
    try {
        const txHash = await storeScoreOnChain(player as HexString, BigInt(sessionId))
        return NextResponse.json({message: 'Score Submitted', data : {txHash : txHash   }})
    } catch (e) {
        console.error(e)
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

async function storeScoreOnChain(player: HexString, sessionIndex: bigint) {
    const { request } = await publicClient.simulateContract({
        address: contractAddresses.ScoreManager,
        abi: scoreManagerAbi,
        functionName: "storeScore",
        args: [player, sessionIndex],
        account,
    })
    console.log(request)
    return await walletClient.writeContract(request)
}
