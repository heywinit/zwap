import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../index.css";
import Providers from "@/components/providers";
import { WalletProvider } from "@/components/wallet-provider";
import { TopBar } from "@/components/top-bar";
import DemoBanner from "@/components/demo-banner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "zwap",
  description: "zwap",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <WalletProvider>
          <Providers>
            <TopBar />
            {process.env.NEXT_PUBLIC_DEMO_MODE === "true" && (
              <div className="container mx-auto px-4">
                <DemoBanner
                  onQuickDeposit={() => {
                    const event = new CustomEvent("demo-prefill", {
                      detail: {
                        zAddress:
                          "u1t37dummyt3stzc4shaddr3ss000000000000000000000000000000000",
                        amount: "0.01",
                      },
                    });
                    window.dispatchEvent(event);
                  }}
                />
              </div>
            )}
            <div className="">{children}</div>
          </Providers>
        </WalletProvider>
      </body>
    </html>
  );
}
