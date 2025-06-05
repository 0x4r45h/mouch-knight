import {NextResponse} from "next/server";
import {APP_URL} from "@/config";

export async function GET() {
    const farcasterConfig = {
        accountAssociation: {
            header: "eyJmaWQiOjEwNzgwNzYsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHhFM0YzOTY0MjNjRTAyNzUyN2I0ODI1YTIyNzE3ZTVjMDFkY2Y5RDNjIn0",
            payload: "eyJkb21haW4iOiJtb3VjaC1rbmlnaHQtZmFyY2FzdGVyLmVtYmVyc3Rha2UueHl6In0",
            signature: "MHgyZDAxNzExMjhiYTU4OTYwYTRlNWI2YTg3MzQwYzM0MzRkMzc1M2Y1ZDg4Y2Y1ZmIyMTU3Y2JhOTRjNThjNGJkMDI5OGM2Mzk4NzUxMzI4NjBjMGY0MDM2NDc0ODlmOTg5YmVkZGY3MmY1MmMxNjc4NTU3ZjY3ODYxNWZkZjJkNDFi"
        },
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
            tags: ["monad", "farcaster", "miniapp", "minigame", "game"],
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
