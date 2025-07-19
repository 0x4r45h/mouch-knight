'use client'

import {WALLET_PROVIDER} from '@/config'
import {useLogin, useLogout, usePrivy, useWallets} from '@privy-io/react-auth'
import {UserPill} from '@privy-io/react-auth/ui';
import {supportedChains} from '@/config/privy';
import {useState} from 'react';

interface ConnectButtonProps {
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export const ConnectButton: React.FC<ConnectButtonProps> = ({
                                                                size = 'sm',
                                                                className = '',
                                                            }) => {
    if (WALLET_PROVIDER === 'privy') {
        return <PrivyConnectButton size={size} />
    }

    return <ReownConnectButton size={size} className={className}/>
}

function PrivyConnectButton({size}: {size?: 'sm' | 'md' | 'lg'}) {
    const {ready, authenticated} = usePrivy()
    const {wallets} = useWallets()
    const {login} = useLogin()
    const {logout} = useLogout()
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [isSwitching, setIsSwitching] = useState(false)

    const chains = supportedChains()

    const handleSwitchNetwork = async (chainId: number) => {
        const wallet = wallets[0]
        if (wallet) {
            setIsSwitching(true)
            try {
                await wallet.switchChain(chainId)
                console.log('Network switched successfully')
                setIsDropdownOpen(false)
            } catch (error) {
                console.error('Failed to switch network:', error)
            } finally {
                setIsSwitching(false)
            }
        }
    }

    if (!ready) return <div>Loading...</div>

    if (authenticated) {
        return (
            <div>
                <button onClick={logout} className="btn">
                    Disconnect
                </button>
                <UserPill />

                {/* Network switching dropdown - only show in development and when size is 'sm' */}
                {process.env.NODE_ENV !== 'production' && size === 'sm' && (
                    <div className="relative inline-block">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="btn btn-sm ml-2"
                            disabled={isSwitching}
                        >
                            {isSwitching ? 'Switching...' : 'Switch Network'}
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 mt-1 bg-black border border-gray-300 rounded-md shadow-lg z-10 min-w-[150px]">
                                {chains.map((chain) => (
                                    <button
                                        key={chain.id}
                                        onClick={() => handleSwitchNetwork(chain.id)}
                                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 first:rounded-t-md last:rounded-b-md"
                                        disabled={isSwitching}
                                    >
                                        {chain.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div>
            <button onClick={login} className="btn">
                Connect Wallet
            </button>
            <UserPill />
        </div>
    )
}

function ReownConnectButton({size, className}: ConnectButtonProps) {
    return (
        <div>
            {/* @ts-expect-error - appkit-button is a web component */}
            <appkit-button balance="hide" size={size} className={className}/>
        </div>
    )
}