import React, { useState, useEffect } from 'react';
import { Button, Modal, Label, TextInput, Radio } from "flowbite-react";
import { HiX } from 'react-icons/hi';
import {
  useAccount,
  useBalance,
  type BaseError,
  usePublicClient,
  useSendTransaction,
  useWaitForTransaction,
  useWaitForTransactionReceipt
} from 'wagmi';

import {
  decodeErrorResult,
} from 'viem';

import { useAppKitNetwork } from "@reown/appkit/react";
import { formatTokenAmount, gameConfig } from '@/config/gameConfig';
import { getContractConfig, HexString } from '@/config';
import {
  ierc20ErrorsAbi,
  useReadScoreTokenAllowance,
  useSimulateItemPurchaseManagerDepositTokens,
  useWriteScoreTokenApprove
} from '@/generated';
import { useWriteItemPurchaseManagerDepositTokens } from '@/generated';

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
  const [quantity, setQuantity] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mkt');
  const [isApproving, setIsApproving] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { address } = useAccount();
  const { chainId } = useAppKitNetwork();
  
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
  const { data: nativeBalance } = useBalance({
    address,
    chainId,
  });
  
  // Get MKT allowance
  const { data: allowance, refetch: refetchAllowance } = useReadScoreTokenAllowance({
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
  const { writeContractAsync: approveTokens } = useWriteScoreTokenApprove();
  
  // Setup purchase function
  const { writeContractAsync: depositTokens, error: depositMKTError,
  } = useWriteItemPurchaseManagerDepositTokens();

  // get purchase tx receipt
  // const { isLoading: isConfirming, isSuccess: isConfirmed } =
  //     useWaitForTransactionReceipt({
  //       purchaseTxHash,
  //     })

  // get access to publicClient for imperative tx receipt checks
  const publicClient = usePublicClient()

  // Handle quantity change
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0 && value <= 10) {
      setQuantity(value);
    }
  };
  
  // Handle payment method change
  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
  };
  
  // Handle approve
  const handleApprove = async () => {
    if (!address || !chainId || !scoreTokenConfig || !purchaseManagerConfig) return;
    
    setIsApproving(true);
    setError(null);
    
    try {
      const hash = await approveTokens({
        address: scoreTokenConfig.address,
        args: [purchaseManagerConfig.address, totalCost],
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
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
    if (!address || !chainId || !purchaseManagerConfig) return;
    
    setIsPurchasing(true);
    setError(null);


    try {
      await publicClient.simulateContract({
        address: purchaseManagerConfig.address,
        abi: purchaseManagerConfig.abi,
        functionName: 'depositTokens',
        args: [totalCost],
        account: address,
      });
    } catch (simulationError) {
      console.log('simulationError is  : ', simulationError);
      const revertData = simulationError?.cause?.data || simulationError?.data;
      if (revertData) {
        const decoded = decodeErrorResult({
          abi: ierc20ErrorsAbi,
          data: revertData,
        });
        console.error('🧠 Revert reason (simulated):', decoded);
        throw new Error(`Contract reverted: ${decoded.errorName}`);
      }
      throw simulationError; // Unknown error
    }
    finally {
      setIsPurchasing(false);
    }




    try {
      let receipt;
      
      if (paymentMethod === 'mkt') {

        // ERC20 token purchase
        const hash = await depositTokens({
          address: purchaseManagerConfig.address,
          args: [totalCost],
        });

        receipt = await publicClient.waitForTransactionReceipt({ hash })
        if (!receipt || receipt.status !== 'success') {
          console.log('receipt is : ', receipt);
          throw new Error('Failed to deposit tokens');
        }
      } else {
        // Native token purchase
        const tx = await sendTransaction({
          to: purchaseManagerConfig.address,
          value: totalCost,
        });
        
        // Wait for transaction to be mined
        receipt = await waitForTransaction({
          hash: tx.hash,
        });
      }
      setTxHash(receipt.transactionHash as HexString);
      
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
      console.error('Purchase error:', err);
      console.log(err);
      console.log('depositMKTError is  : ', depositMKTError);
      setError('Failed to purchase game sessions. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };
  
  return (
    <Modal show={show} onClose={onClose} size="md">
      <Modal.Header className="border-b border-gray-200 !p-6 dark:border-gray-700">
        <div className="flex items-center justify-between w-full">
          <h3 className="text-xl font-medium text-gray-900 dark:text-white">
            Purchase Game Sessions
          </h3>
          <Button color="gray" onClick={onClose} className="!p-2">
            <HiX className="h-5 w-5" />
          </Button>
        </div>
      </Modal.Header>
      <Modal.Body>
        <div className="space-y-6">
          <div>
            <p className="text-base text-gray-500 dark:text-gray-400">
              You&#39;re in cooldown for {formatRemainingTime(remainingSeconds)}. Purchase additional game sessions to play now!
            </p>
          </div>
          
          <div>
            <Label htmlFor="quantity" value="Number of Sessions" />
            <TextInput
              id="quantity"
              type="number"
              // min={1}
              // max={10}
              value={quantity}
              onChange={handleQuantityChange}
              className="mt-1"
            />
          </div>
          
          <div className="space-y-2">
            <Label value="Payment Method" />
            
            <div className="flex items-center gap-2">
              <Radio
                id="mkt"
                name="payment"
                value="mkt"
                checked={paymentMethod === 'mkt'}
                onChange={() => handlePaymentMethodChange('mkt')}
                disabled={!mktEnabled}
              />
              <Label htmlFor="mkt">
                MKT Token ({formatTokenAmount(gameConfig.sessionCost.mkt.perSession)} per session)
              </Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Radio
                id="native"
                name="payment"
                value="native"
                checked={paymentMethod === 'native'}
                onChange={() => handlePaymentMethodChange('native')}
                disabled={!nativeEnabled}
              />
              <Label htmlFor="native">
                {nativeBalance?.symbol || 'MON'} ({formatTokenAmount(gameConfig.sessionCost.native.perSession)} per session)
              </Label>
            </div>
          </div>
          
          <div className="font-medium">
            Total Cost: {formatTokenAmount(totalCost.toString())} {paymentMethod === 'mkt' ? 'MKT' : (nativeBalance?.symbol || 'MON')}
          </div>
          
          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div className="w-full flex justify-end gap-2">
          {needsApproval && paymentMethod === 'mkt' ? (
            <Button 
              color="primary"
              onClick={handleApprove}
              disabled={isApproving}
              isProcessing={isApproving}
            >
              {isApproving ? 'Approving...' : 'Approve MKT'}
            </Button>
          ) : (
            <Button 
              color="primary"
              onClick={handlePurchase}
              disabled={isPurchasing}
              isProcessing={isPurchasing}
            >
              {isPurchasing ? 'Processing...' : 'Purchase'}
            </Button>
          )}
          <Button color="gray" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default PurchaseSessionsModal;