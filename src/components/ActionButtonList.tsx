'use client'
import { useDisconnect, useAppKit, useAppKitNetwork  } from '@reown/appkit/react'
import {config, networks} from '@/config'
import { useReadContract } from 'wagmi'
import {erc20Abi, useReadErc20TotalSupply} from "@/generated";
export const ActionButtonList = () => {
    const {disconnect} = useDisconnect();
    const { open } = useAppKit();
    const { switchNetwork } = useAppKitNetwork();
  return (
    <div >
        <button onClick={() => open()}>Open</button>
        <button onClick={() => disconnect()}>Disconnect</button>
        <button onClick={() => switchNetwork(networks[1]) }>Switch</button>
        <button onClick={() => useReadContract({
            abi: erc20Abi,
            address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
            functionName: 'totalSupply',
        }) }>ReadContract</button>
        <button onClick={() => () => console.log(useReadErc20TotalSupply()) }>ReadContract2</button>
    </div>
  )
}
// const { data: total2} = useReadErc20TotalSupply()
// const readCon = useReadContract({
//     abi: erc20Abi,
//     address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
//     functionName: 'totalSupply',
// })

// const totalSupply = async function () {
//     const r =  await readCon
//     console.log(r);
// }
