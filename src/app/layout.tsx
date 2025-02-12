import type { Metadata } from "next";
import "./globals.css";
import { headers } from "next/headers";
import ContextProvider from "@/context";
import { ConnectButton } from "@/components/ConnectButton";

export const metadata: Metadata = {
  title: "Next.js + Wagmi + Tailwind",
  description: "Responsive dApp Layout Example",
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
      <body className="flex flex-col min-h-screen bg-gray-100">
        <ContextProvider cookies={cookies}>
          {/* Header */}
          <header className="flex items-center justify-between px-4 py-3 bg-gray-800 text-white md:px-6 lg:px-8">
            <h1 className="text-lg font-semibold sm:text-xl md:text-2xl">
              Mouch Knight
            </h1>
            <ConnectButton />
          </header>

          {/* Main Content Area */}
          <main className="flex-1 w-full max-w-screen-xl mx-auto px-4 py-6 md:px-6 lg:px-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="bg-gray-800 text-white py-4 px-4 md:px-6 lg:px-8">
            <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4 md:justify-end">
              <a href="#" className="hover:text-blue-400">
                Website
              </a>
              <a href="#" className="hover:text-blue-400">
                Twitter
              </a>
              <a href="#" className="hover:text-blue-400">
                GitHub
              </a>
            </div>
          </footer>
        </ContextProvider>
      </body>
    </html>
  );
}
