"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { Connection, PublicKey } from "@solana/web3.js";
import { ZwapClient } from "@zwap/solana";
import { useWalletAuth } from "@/hooks/use-wallet-auth";
import { trpc } from "@/utils/trpc";
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

const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"); // Mainnet USDC

export function DepositForm() {
  const { publicKey, signTransaction } = useWallet();
  const { isAuthenticated } = useWalletAuth();
  const router = useRouter();
  const [token, setToken] = useState<Token>("SOL");
  const [amount, setAmount] = useState("");
  const [zcashAddress, setZcashAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated || !publicKey || !signTransaction) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!amount || Number.parseFloat(amount) <= 0) {
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
      // 1. Create deposit record in backend
      toast.loading("Creating deposit...");
      const deposit = await trpc.deposit.startDeposit.mutate({
        asset: token,
        amount: amount,
        zAddress: zcashAddress,
        userPubkey: publicKey.toString(),
      });

      toast.dismiss();
      toast.loading("Building transaction...");

      // 2. Create Solana transaction
      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
          "https://api.devnet.solana.com",
        "confirmed"
      );

      const zwapClient = new ZwapClient(connection, { publicKey });

      const transaction =
        token === "SOL"
          ? await zwapClient.buildDepositSolTransaction(
              publicKey,
              Number.parseFloat(amount),
              deposit.depositId,
              zcashAddress
            )
          : await zwapClient.buildDepositUsdcTransaction(
              publicKey,
              Number.parseFloat(amount),
              deposit.depositId,
              zcashAddress,
              USDC_MINT
            );

      // 3. Sign transaction
      toast.dismiss();
      toast.loading("Waiting for signature...");
      const signedTx = await signTransaction(transaction);

      // 4. Send transaction
      toast.dismiss();
      toast.loading("Sending transaction...");
      const signature = await connection.sendRawTransaction(
        signedTx.serialize()
      );

      // 5. Confirm transaction
      toast.dismiss();
      toast.loading("Confirming transaction...");
      await connection.confirmTransaction(signature, "confirmed");

      // 6. Update backend with signature
      await trpc.deposit.updateSolanaTx.mutate({
        depositId: deposit.depositId,
        solanaTx: signature,
      });

      toast.dismiss();
      toast.success("Deposit successful!");

      // 7. Redirect to status page
      router.push(`/status/${signature}`);
    } catch (error) {
      toast.dismiss();
      console.error("Deposit error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create deposit"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="mx-auto max-w-md">
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
    <Card className="mx-auto max-w-md">
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
