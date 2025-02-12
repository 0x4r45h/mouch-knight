'use client'

import { useEffect } from 'react'
import {
    useAppKitState,
    useAppKitTheme,
    useAppKitEvents,
    useAppKitAccount,
    useWalletInfo
     } from '@reown/appkit/react'
import {useReadContract, useAccount} from "wagmi";
import {erc20Abi, useReadDelegatedMessageStorageDeposits, useReadErc20TotalSupply} from "@/generated";
import {contractAddresses} from "@/config";

export const InfoList = () => {
    const kitTheme = useAppKitTheme();
    const state = useAppKitState();
    const {address, caipAddress, isConnected} = useAppKitAccount();
    const events = useAppKitEvents()
    const walletInfo = useWalletInfo()
    const account = useAccount()

    const usdc = useReadContract( {
        abi: erc20Abi,
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        functionName: 'totalSupply',
    })
    const usdcHook = useReadErc20TotalSupply( {
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    })
    const usdcSepoliaHook = useReadErc20TotalSupply( {
        address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    })
    const handleRefresh = () => {
        usdcHook.refetch(); // This will rerun the hook
    };
    const handleRefreshSepolia = () => {
        usdcSepoliaHook.refetch(); // This will rerun the hook
    };
    const handleRefreshDepositAmount = () => {
        depositedAmount.refetch(); // This will rerun the hook
    };
    const depositedAmount = useReadDelegatedMessageStorageDeposits({
        address: contractAddresses.DelegatedMessageStorage,
        args: [account.address ?? '0x'],
    })
    useEffect(() => {
        console.log("Events: ", events);
    }, [events]);

  return (
    <div >
        <section>
            <h2>useAppKit</h2>
            <pre>
                Address: {address}<br />
                caip Address: {caipAddress}<br />
                Connected: {isConnected.toString()}<br />
            </pre>
        </section>

        <section>
            <h2>Theme</h2>
            <pre>
                Theme: {kitTheme.themeMode}<br />
            </pre>
        </section>

        <section>
            <h2>State</h2>
            <pre>
                activeChain: {state.activeChain}<br />
                loading: {state.loading.toString()}<br />
                open: {state.open.toString()}<br />
            </pre>
        </section>

        <section>
            <h2>WalletInfo</h2>
            <pre>
                Name: {walletInfo.walletInfo?.name?.toString()}<br />
            </pre>
        </section>

        <section>
            <h2> My deposit on Contract</h2>
            <pre>
                MY Deposit: {depositedAmount.data}<br />
                MY Deposit Status: {depositedAmount.status}<br />
                MY Deposit Error: {depositedAmount.error?.toString()}<br />
            </pre>
            <button onClick={handleRefreshDepositAmount}>Refresh Data</button>
        </section>
    </div>
  )
}
