'use client'

export const ConnectButton = () => {
    return (
    <div >
        {/* @ts-expect-error msg */}
        <appkit-button balance='hide' />
    </div>
  )
}
