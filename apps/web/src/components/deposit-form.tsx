"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletAuth } from "@/hooks/use-wallet-auth";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Token = "SOL" | "USDC";

export function DepositForm() {
  const { publicKey, signTransaction } = useWallet();
  const { isAuthenticated } = useWalletAuth();
  const [token, setToken] = useState<Token>("SOL");
  const [amount, setAmount] = useState("");
  const [zcashAddress, setZcashAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated || !publicKey) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (
      !zcashAddress ||
      (!zcashAddress.startsWith("z") && !zcashAddress.startsWith("u1"))
    ) {
      toast.error(
        "Please enter a valid Zcash shielded address (starts with 'z' or 'u1')"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Implement deposit transaction
      // 1. Create Solana transaction
      // 2. Sign transaction
      // 3. Send to backend
      // 4. Redirect to status page

      toast.success("Deposit initiated");
      // Temporary: simulate redirect
      // router.push(`/status/${signature}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create deposit"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Connect Wallet</CardTitle>
          <CardDescription>
            Please connect your Solana wallet to continue
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Deposit to Zcash</CardTitle>
        <CardDescription>
          Send SOL or USDC to receive ZEC in your shielded address
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Token</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={token === "SOL" ? "default" : "outline"}
                onClick={() => setToken("SOL")}
                className="flex-1"
              >
                SOL
              </Button>
              <Button
                type="button"
                variant={token === "USDC" ? "default" : "outline"}
                onClick={() => setToken("USDC")}
                className="flex-1"
              >
                USDC
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="any"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="zcash-address">Zcash Shielded Address</Label>
            <Input
              id="zcash-address"
              type="text"
              placeholder="z1..."
              value={zcashAddress}
              onChange={(e) => setZcashAddress(e.target.value)}
              required
            />
            <p className="text-muted-foreground text-xs">
              Enter a Zcash shielded address (starts with z or u1)
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" />
                Processing...
              </>
            ) : (
              "Deposit"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
