import {NextRequest, NextResponse} from 'next/server';
import prisma from "@/db/client";
import {HexString, getPublicClientByChainId, getContractConfig} from "@/config";
import {decodeEventLog} from 'viem';
import gameConfig from "@/config/gameConfig";

interface PurchaseRequest {
    player: HexString;
    chain_id: number;
    tx_hash: HexString;
    payment_method: 'mkt' | 'native';
    quantity: number;
    total_cost: string;
}

interface TokenDepositedEvent {
    event: 'NativeTokenDeposited' | 'TokensReceived';
    args: {
        player: HexString;
        amount: bigint;
        timestamp: bigint;
    };
}


export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body: PurchaseRequest = await request.json();

        // Validate required fields
        if (!body.player || !body.chain_id || !body.tx_hash || !body.payment_method || !body.quantity) {
            return NextResponse.json({
                success: false,
                message: "Missing required fields"
            }, {status: 400});
        }


        const publicClient = getPublicClientByChainId(body.chain_id);
        const purchaseManagerConfig = getContractConfig('ItemPurchaseManager', body.chain_id);
        const receipt = await publicClient.getTransactionReceipt({hash: body.tx_hash});
        const decodedEvents = [];
        for (const log of receipt.logs) {
            try {
                // Only decode logs from the contract address
                if (log.address.toLowerCase() === purchaseManagerConfig.address.toLowerCase()) {
                    const decoded = decodeEventLog({
                        abi: purchaseManagerConfig.abi,
                        data: log.data,
                        topics: log.topics,
                    });
                    decodedEvents.push(decoded);
                }
            } catch {
                // Not all logs will match the ABI, so ignore decode errors
            }
        }
        let validTx = false;
        let amount = BigInt(0);
        let paymentMethod = '';
        for (const e of decodedEvents) {
            if (e.eventName === 'NativeTokenDeposited') {
                const event = e as unknown as TokenDepositedEvent;
                console.log('event is : ', event)
                if (event.args.player.toLowerCase() === body.player.toLowerCase() &&
                    event.args.amount >= BigInt(gameConfig.sessionCost.native.perSession) * BigInt(body.quantity)) {
                    validTx = true;
                    amount = event.args.amount;
                    paymentMethod = 'native';
                    break;
                }
            }
            if (e.eventName === 'TokensReceived') {
                const event = e as unknown as TokenDepositedEvent;
                if (event.args.player.toLowerCase() === body.player.toLowerCase() &&
                    event.args.amount >= BigInt(gameConfig.sessionCost.mkt.perSession) * BigInt(body.quantity)) {
                    validTx = true;
                    amount = event.args.amount;
                    paymentMethod = 'mkt';
                    break;
                }
            }
        }
        if (!validTx) {
            return NextResponse.json({
                success: false,
                message: "Invalid transaction"
            }, {status: 400});
        }

        // Get or create player
        const player = await prisma.player.upsert({
            where: {address: body.player},
            create: {address: body.player},
            update: {}
        });

        // Record the purchase
        const purchase = await prisma.sessionPurchase.create({
            data: {
                playerId: player.id,
                chainId: body.chain_id,
                txHash: body.tx_hash,
                paymentMethod: paymentMethod,
                quantity: body.quantity,
                totalCost: amount.toString()
            }
        });

        // Reset the player's cooldown to allow immediate play
        await prisma.playerCooldown.upsert({
            where: {playerId: player.id},
            create: {
                playerId: player.id,
                lastPlayed: new Date(0) // Set to a date in the past to bypass cooldown
            },
            update: {
                lastPlayed: new Date(0) // Set to a date in the past to bypass cooldown
            }
        });

        return NextResponse.json({
            success: true,
            message: "Purchase successful",
            data: {purchase_id: purchase.id}
        });
    } catch (error) {
        console.error('Error processing purchase:', error);
        return NextResponse.json({
            success: false,
            message: "Failed to process purchase"
        }, {status: 500});
    }
}