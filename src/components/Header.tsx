'use client'
import {ConnectButton} from "@/components/ConnectButton";

export const Header = () => {
    return (
        <header className="flex items-center justify-between px-4 py-3 dark-background  md:px-6 lg:px-8">
            <h1 className="text-lg font-semibold sm:text-xl md:text-2xl">
                Mouch Knight
            </h1>
            <div>
                <ConnectButton/>
            </div>
        </header>
    )
}
