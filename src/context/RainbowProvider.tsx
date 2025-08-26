'use client'

import React, {type ReactNode} from 'react'
import {RainbowKitProvider} from '@rainbow-me/rainbowkit';

import {WagmiProvider} from 'wagmi';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {rainbowWagmiConfig} from "@/config/rainbow";

const queryClient = new QueryClient()

interface WalletProviderProps {
    children: ReactNode
}

export default function RainbowWalletProvider({children}: WalletProviderProps) {
    return (
        <WagmiProvider config={rainbowWagmiConfig}>
            <QueryClientProvider client={queryClient}>
                 <RainbowKitProvider 
                    modalSize="compact"
                    theme={{
                        shadows: {
                            connectButton: 'none',
                            dialog: 'none',
                            profileDetailsAction: 'none',
                            selectedOption: 'none',
                            selectedWallet: 'none',
                            walletLogo: 'none',
                        },
                        blurs: {
                            modalOverlay: 'blur(4px)',
                        },
                        colors: {
                            accentColor: '#836EF9', // monad-purple
                            accentColorForeground: '#FBFAF9', // monad-off-white
                            actionButtonBorder: '#A0055D', // monad-berry
                            actionButtonBorderMobile: '#A0055D',
                            actionButtonSecondaryBackground: '#200052', // monad-blue
                            closeButton: '#FBFAF9',
                            closeButtonBackground: '#200052',
                            connectButtonBackground: '#836EF9',
                            connectButtonBackgroundError: '#A0055D',
                            connectButtonInnerBackground: '#200052',
                            connectButtonText: '#FBFAF9',
                            connectButtonTextError: '#FBFAF9',
                            connectionIndicator: '#00ff00',
                            downloadBottomCardBackground: '#200052',
                            downloadTopCardBackground: '#3c048e', // monad-light-blue
                            error: '#A0055D',
                            generalBorder: '#836EF9',
                            generalBorderDim: '#200052',
                            menuItemBackground: '#200052',
                            modalBackdrop: 'rgba(32, 0, 82, 0.8)',
                            modalBackground: '#3c048e',
                            modalBorder: '#836EF9',
                            modalText: '#FBFAF9',
                            modalTextDim: 'rgba(251, 250, 249, 0.7)',
                            modalTextSecondary: 'rgba(251, 250, 249, 0.8)',
                            profileAction: '#200052',
                            profileActionHover: '#836EF9',
                            profileForeground: '#3c048e',
                            selectedOptionBorder: '#A0055D',
                            standby: '#836EF9',
                        },
                        fonts: {
                            body: 'Inter, ui-sans-serif, system-ui',
                        },
                        radii: {
                            actionButton: '8px',
                            connectButton: '8px',
                            menuButton: '8px',
                            modal: '12px',
                            modalMobile: '12px',
                        },
                    }}
                >
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>

    )
}
