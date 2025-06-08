import React, {useState, useEffect} from 'react';
import {Button, Modal} from "flowbite-react";
import {
    useAccount,
    useBalance,
    usePublicClient,
    useSendTransaction,
} from 'wagmi';

import {
    BaseError,
    ContractFunctionRevertedError,
} from 'viem';

import {useAppKitNetwork} from "@reown/appkit/react";
import {formatTokenAmount, gameConfig} from '@/config/gameConfig';
import {getContractConfig} from '@/config';
import {
    useReadScoreTokenAllowance,
    useWriteScoreTokenApprove
} from '@/generated';
import {useWriteItemPurchaseManagerDepositTokens} from '@/generated';
import { HiX } from 'react-icons/hi';

interface PurchaseSessionsModalProps {
    show: boolean;
    onClose: () => void;
    remainingSeconds: number;
}

type PaymentMethod = 'mkt' | 'native';

const PurchaseSessionsModal: React.FC<PurchaseSessionsModalProps> = ({
                                                                         show,
                                                                         onClose,
                                                                         remainingSeconds
                                                                     }) => {
    const [quantity] = useState<number>(1);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mkt');
    const [isApproving, setIsApproving] = useState(false);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {address} = useAccount();
    const {chainId: appKitChainId} = useAppKitNetwork();
    const chainId = typeof appKitChainId === 'string' ? parseInt(appKitChainId) : appKitChainId;

    const {sendTransactionAsync: sendNativeToken} = useSendTransaction();

    // Format remaining time for display
    const formatRemainingTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    // Get contract configs
    const scoreTokenConfig = chainId ? getContractConfig('ScoreToken', chainId) : null;
    const purchaseManagerConfig = chainId ? getContractConfig('ItemPurchaseManager', chainId) : null;

    // Get token balances
    const {data: nativeBalance} = useBalance({
        address,
        chainId,
    });

    // Get MKT allowance
    const {data: allowance, refetch: refetchAllowance} = useReadScoreTokenAllowance({
        address: scoreTokenConfig?.address,
        args: address && purchaseManagerConfig ? [address, purchaseManagerConfig.address] : undefined,
        query: {
            enabled: !!address && !!purchaseManagerConfig && !!scoreTokenConfig,
        },
    });

    // Calculate total cost based on the game config
    const totalCost = paymentMethod === 'mkt'
        ? BigInt(gameConfig.sessionCost.mkt.perSession) * BigInt(quantity)
        : BigInt(gameConfig.sessionCost.native.perSession) * BigInt(quantity);

    // Check if payment methods are enabled
    const mktEnabled = gameConfig.sessionCost.mkt.enabled;
    const nativeEnabled = gameConfig.sessionCost.native.enabled;

    // Set default payment method based on what's enabled
    useEffect(() => {
        if (!mktEnabled && nativeEnabled) {
            setPaymentMethod('native');
        } else if (mktEnabled && !nativeEnabled) {
            setPaymentMethod('mkt');
        }
    }, [mktEnabled, nativeEnabled]);

    // Check if allowance is sufficient
    const needsApproval = paymentMethod === 'mkt' && allowance !== undefined && allowance < totalCost;

    // Setup approve function
    const {writeContractAsync: approveTokens} = useWriteScoreTokenApprove();

    // Setup purchase function
    const {
        writeContractAsync: depositTokens,
    } = useWriteItemPurchaseManagerDepositTokens();

    // get access to publicClient for imperative tx receipt checks
    const publicClient = usePublicClient()

    // Handle payment method change
    const handlePaymentMethodChange = (method: PaymentMethod) => {
        setPaymentMethod(method);
    };

    // Handle approve
    const handleApprove = async () => {
        if (!address || !chainId || !scoreTokenConfig || !purchaseManagerConfig || !publicClient) return;

        setIsApproving(true);
        setError(null);

        try {
            const hash = await approveTokens({
                address: scoreTokenConfig.address,
                args: [purchaseManagerConfig.address, totalCost],
            });
            const receipt = await publicClient.waitForTransactionReceipt({hash})
            if (!receipt || receipt.status !== 'success') {
                throw new Error('Failed to approve tokens');
            }
            // Refetch allowance
            await refetchAllowance();
        } catch (err) {
            console.log(err);
            setError('Failed to approve tokens. Please try again.');
        } finally {
            setIsApproving(false);
        }
    };

    // Handle purchase
    const handlePurchase = async () => {
        if (!address || !chainId || !purchaseManagerConfig || !scoreTokenConfig || !publicClient) return;

        setIsPurchasing(true);
        setError(null);
        try {
            let receipt;

            if (paymentMethod === 'mkt') {
                const combinedAbi = [...purchaseManagerConfig.abi, ...scoreTokenConfig.abi] as const;

                // Simulate
                await publicClient.simulateContract({
                    address: purchaseManagerConfig.address,
                    abi: combinedAbi,
                    functionName: 'depositTokens',
                    args: [totalCost],
                    account: address,
                });

                // ERC20 token purchase
                const hash = await depositTokens({
                    address: purchaseManagerConfig.address,
                    args: [totalCost],
                });

                receipt = await publicClient.waitForTransactionReceipt({hash})
                if (!receipt || receipt.status !== 'success') {
                    throw new Error('Failed to deposit tokens');
                }
            } else {
                // Native token purchase
                const hash = await sendNativeToken({
                    to: purchaseManagerConfig.address,
                    value: totalCost,
                });

                // Wait for transaction to be mined
                receipt = await publicClient.waitForTransactionReceipt({hash})
                if (!receipt || receipt.status !== 'success') {
                    throw new Error('Failed to deposit Native token');
                }
            }
            // Send transaction info to backend
            await fetch('/api/game/purchase', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    player: address,
                    chain_id: chainId,
                    tx_hash: receipt.transactionHash,
                    payment_method: paymentMethod,
                    quantity: quantity,
                    total_cost: totalCost.toString(),
                }),
            });

            // Close modal after successful purchase
            onClose();
        } catch (err) {
            if (err instanceof BaseError) {
                const revertError = err.walk(err => err instanceof ContractFunctionRevertedError)
                if (revertError instanceof ContractFunctionRevertedError) {
                    const { data } = revertError
                    if (data) {
                        if (data.errorName === 'ERC20InsufficientBalance') {
                            setError('Insufficient MKT balance.');
                        } else if (data.errorName === 'ERC20InsufficientAllowance') {
                            setError('Insufficient MKT Allowance.');
                            refetchAllowance();
                        } else {
                            throw revertError
                        }
                    } else {
                        throw revertError
                    }
                }
            } else {
                console.error('Purchase error:', err);
                setError('Failed to purchase game sessions. Please try again.');
            }
        } finally {
            setIsPurchasing(false);
        }
    };

    return (
        <Modal dismissible show={show} onClose={onClose}>
            <div className="bg-monad-light-blue text-monad-off-white rounded-t-lg relative">
                <div className="p-4 text-center text-2xl font-bold">Purchase Game Sessions</div>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-monad-off-white hover:text-white"
                    aria-label="Close"
                >
                    <HiX className="w-5 h-5" />
                </button>
            </div>
            <div className="bg-monad-light-blue text-monad-off-white p-6">
                <div className="space-y-6">
                    <div>
                        <p className="text-center text-sm">
                            You&#39;re in cooldown for {formatRemainingTime(remainingSeconds)}. Purchase additional game sessions to play now!
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-center">Choose Payment Method</h3>

                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => handlePaymentMethodChange('native')}
                                disabled={!nativeEnabled}
                                className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                                    paymentMethod === 'native'
                                        ? 'border-monad-berry bg-monad-berry bg-opacity-20'
                                        : 'border-monad-purple border-opacity-30 hover:border-opacity-50'
                                } ${!nativeEnabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <img src="/images/monad-logo.png" alt="MON" className="w-12 h-12 mb-2" />
                                <span className="font-semibold">Pay with MON</span>
                                <span className="text-sm text-monad-off-white opacity-80">
                                    {formatTokenAmount(gameConfig.sessionCost.native.perSession)} per session
                                </span>
                            </button>

                            <button
                                onClick={() => handlePaymentMethodChange('mkt')}
                                disabled={!mktEnabled}
                                className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                                    paymentMethod === 'mkt'
                                        ? 'border-monad-berry bg-monad-berry bg-opacity-20'
                                        : 'border-monad-purple border-opacity-30 hover:border-opacity-50'
                                } ${!mktEnabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <img src="/images/coin.svg" alt="MKT" className="w-12 h-12 mb-2" />
                                <span className="font-semibold">Pay with MKT</span>
                                <span className="text-sm text-monad-off-white opacity-80">
                                    {formatTokenAmount(gameConfig.sessionCost.mkt.perSession)} per session
                                </span>
                            </button>
                        </div>
                    </div>

                    <div className="bg-monad-purple bg-opacity-20 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold">Total Cost:</span>
                            <span className="text-xl font-bold">
                                {formatTokenAmount(totalCost.toString())} {paymentMethod === 'mkt' ? 'MKT' : (nativeBalance?.symbol || 'MON')}
                            </span>
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-400 text-sm text-center bg-red-900 bg-opacity-20 p-3 rounded-lg">
                            {error}
                        </div>
                    )}
                </div>
            </div>
            <div className="bg-monad-light-blue text-monad-off-white p-4 flex justify-between items-center rounded-b-lg">
                <Button
                    size="lg"
                    color="primary"
                    className="rounded disabled:opacity-50 bg-monad-berry"
                    onClick={onClose}
                >
                    Cancel
                </Button>
                {needsApproval && paymentMethod === 'mkt' ? (
                    <Button
                        size="lg"
                        color="primary"
                        className="rounded disabled:opacity-50 bg-monad-berry"
                        onClick={handleApprove}
                        disabled={isApproving}
                    >
                        {isApproving ? 'Approving...' : 'Approve MKT'}
                    </Button>
                ) : (
                    <Button
                        size="lg"
                        color="primary"
                        className="rounded disabled:opacity-50 bg-monad-berry"
                        onClick={handlePurchase}
                        disabled={isPurchasing}
                    >
                        {isPurchasing ? 'Processing...' : 'Purchase'}
                    </Button>
                )}

            </div>
        </Modal>
    );
};

export default PurchaseSessionsModal;