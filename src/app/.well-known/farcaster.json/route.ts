import { NextResponse } from "next/server";
import {APP_URL} from "@/config";

export async function GET() {
    const farcasterConfig = {
        // accountAssociation: {
        //     "header": "",
        //     "payload": "",
        //     "signature": ""
        // },
        frame: {
            version: "1",
            name: "Mouch Knight",
            description: "An on-chain fun minigame for Farcaster users",
            iconUrl: `${APP_URL}/images/icon.png`,
            homeUrl: `${APP_URL}`,
            imageUrl: `${APP_URL}/images/feed.png`,
            screenshotUrls: [
                `${APP_URL}/images/ss1.png`,
                `${APP_URL}/images/ss2.png`,
                `${APP_URL}/images/ss3.png`,
            ],
            tags: ["monad", "farcaster", "miniapp", "minigame", "onchain","game"],
            primaryCategory: "games",
            buttonTitle: "Play Mouch Knight",
            splashImageUrl: `${APP_URL}/images/splash.png`,
            splashBackgroundColor: "#836EF9",
            // webhookUrl: `${APP_URL}/api/webhook`,
            // requiredChains: [
            //     "eip155:10143" //monad testnet
            // ],
            // requiredCapabilities: [
            //     "actions.signIn",
            //     "wallet.getEvmProvider",
            //     "actions.swapToken"
            // ]
        },
    };

    return NextResponse.json(farcasterConfig);
}
