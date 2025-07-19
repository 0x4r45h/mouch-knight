'use client'

import { WALLET_PROVIDER } from '@/config'
import { useLogin, useLogout, usePrivy } from '@privy-io/react-auth'

export const ConnectButton = () => {

  if (WALLET_PROVIDER === 'privy') {
    return <PrivyConnectButton />
  }
  
  return <ReownConnectButton />
}

function PrivyConnectButton() {
  const { ready, authenticated } = usePrivy()
  const { login } = useLogin()
  const { logout } = useLogout()
  
  if (!ready) return <div>Loading...</div>
  
  if (authenticated) {
    return (
      <button onClick={logout} className="btn">
        Disconnect
      </button>
    )
  }
  
  return (
    <button onClick={login} className="btn">
      Connect Wallet
    </button>
  )
}

function ReownConnectButton() {
  return (
      <div >
        {/* @ts-expect-error msg */}
        <appkit-button balance='hide' />
      </div>
  )
}
