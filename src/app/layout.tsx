import type { Metadata } from "next";
import "./globals.css";
import { headers } from "next/headers";
import ContextProvider from "@/context";
import {Header} from "@/components/Header";
import {CustomFlowbiteTheme, Flowbite} from "flowbite-react";
import MaintenanceCheck from "@/components/MaintenanceCheck";

export const metadata: Metadata = {
  title: "Mouch Knight",
  description: "On-Chain game to show off Monad Blockchain technology",
};
const customTheme: CustomFlowbiteTheme = {
  button: {
    color: {
      primary: "bg-primary hover:bg-secondary text-monad-off-white",
    },
  },
};
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersData = await headers();
  const cookies = headersData.get("cookie");

  return (
    <html lang="en">
    <Flowbite theme={{ theme: customTheme }}>
      <body className="flex flex-col min-h-screen  bg-gradient-to-b from-monad-blue via-monad-light-blue to-monad-blue   text-monad-off-white" >
      <ContextProvider cookies={cookies}>
        <Header/>
        <main className="flex-1 w-full max-w-screen-xl mx-auto px-4 py-6 md:px-6 lg:px-8">
          {children}
        </main>

        <footer className="dark-background py-4 px-4 md:px-6 lg:px-8">
          <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4 md:justify-end">
            <a href="https://emberstake.xyz" className="hover:text-blue-400">
              Website
            </a>
            <a href="https://x.com/Ember_Stake" className="hover:text-blue-400">
              Twitter
            </a>
            <a href="https://github.com/0x4r45h/mouch-knight" className="hover:text-blue-400">
              GitHub
            </a>
          </div>
        </footer>
      </ContextProvider>
      <MaintenanceCheck />
      </body>
    </Flowbite>
    </html>
  );
}
