'use client'
import {ConnectButton} from "@/components/ConnectButton";

export const Header = () => {
    return (
        <header className="flex items-center justify-between px-4 py-3 dark-background  md:px-6 lg:px-8">
            {process.env.NODE_ENV === 'production' &&
                (
                    <script defer src="https://umami.emberstake.xyz/script.js"
                            data-website-id={process.env.NEXT_PUBLIC_UMAMI_CODE}></script>
                )}
            <h1 className="text-lg font-semibold sm:text-xl md:text-2xl">
                Mouch Knight
            </h1>
            <div>
                <ConnectButton/>
            </div>
        </header>
    )
}
