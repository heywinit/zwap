"use client";

import { WalletConnectButton } from "./wallet-connect-button";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletAuth } from "@/hooks/use-wallet-auth";
import { Copy, ExternalLink, LogOut } from "lucide-react";
import { toast } from "sonner";

export function TopBar() {
  const { publicKey, disconnect } = useWallet();
  const { isAuthenticated, signOut } = useWalletAuth();

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString());
      toast.success("Address copied to clipboard");
    }
  };

  const viewOnExplorer = () => {
    if (publicKey) {
      window.open(
        `https://solscan.io/account/${publicKey.toString()}?cluster=devnet`,
        "_blank"
      );
    }
  };

  const handleDisconnect = async () => {
    await signOut();
    await disconnect();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 px-4 items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-semibold">ZWAP</h1>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated && publicKey ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <span className="font-mono text-sm">
                    {publicKey.toString().slice(0, 4)}...
                    {publicKey.toString().slice(-4)}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Wallet</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={copyAddress} className="gap-2">
                  <Copy className="size-4" />
                  Copy Address
                </DropdownMenuItem>
                <DropdownMenuItem onClick={viewOnExplorer} className="gap-2">
                  <ExternalLink className="size-4" />
                  View on Explorer
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDisconnect}
                  className="gap-2 text-destructive focus:text-destructive"
                  variant="destructive"
                >
                  <LogOut className="size-4" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <WalletConnectButton />
          )}
        </div>
      </div>
    </header>
  );
}
