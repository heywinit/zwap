"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Clock, ExternalLink, XCircle } from "lucide-react";

export default function StatusPage() {
  const params = useParams();
  const signature = params.signature as string;
  const [pollInterval, setPollInterval] = useState(3000); // Poll every 3 seconds

  // Query deposit status using React Query + tRPC client
  const { data, isLoading, error } = useQuery({
    queryKey: ["deposit", "getBySignature", signature],
    queryFn: () => trpc.deposit.getBySignature.query({ signature }),
    refetchInterval: pollInterval,
    enabled: !!signature,
  });

  // Stop polling once ZEC is sent
  useEffect(() => {
    if (data?.status === "sent" || data?.status === "failed") {
      setPollInterval(0);
    }
  }, [data?.status]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-6 w-6" />
              Deposit Not Found
            </CardTitle>
            <CardDescription>
              Unable to find deposit with signature: {signature}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button>Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (data.status) {
      case "sent":
        return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      case "failed":
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <Clock className="h-6 w-6 text-yellow-500 animate-pulse" />;
    }
  };

  const getStatusText = () => {
    switch (data.status) {
      case "sent":
        return "Completed";
      case "failed":
        return "Failed";
      default:
        return "Processing";
    }
  };

  const getStatusDescription = () => {
    switch (data.status) {
      case "sent":
        return "Your ZEC has been successfully sent to your shielded address";
      case "failed":
        return "There was an error processing your deposit. Please contact support.";
      default:
        return "Your deposit is being processed. ZEC will be sent to your shielded address shortly.";
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Deposit {getStatusText()}
          </CardTitle>
          <CardDescription>{getStatusDescription()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Deposit Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Asset</p>
                <p className="font-medium">{data.asset}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="font-medium">{data.amount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium capitalize">{data.status}</p>
              </div>
            </div>

            {/* Zcash Address */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                Zcash Shielded Address
              </p>
              <p className="font-mono text-sm break-all">{data.zAddress}</p>
            </div>

            {/* Solana Transaction */}
            {data.solanaTx && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  Solana Transaction
                </p>
                <div className="flex items-center justify-between">
                  <p className="font-mono text-sm truncate mr-2">
                    {data.solanaTx}
                  </p>
                  <a
                    href={`https://solscan.io/tx/${data.solanaTx}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    View
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            )}

            {/* Zcash Transaction */}
            {data.zecTxid && (
              <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  Zcash Transaction ID
                </p>
                <div className="flex items-center justify-between">
                  <p className="font-mono text-sm truncate mr-2">
                    {data.zecTxid}
                  </p>
                  <a
                    href={`https://zcashblockexplorer.com/transactions/${data.zecTxid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    View
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            )}

            {/* Processing Message */}
            {data.status === "pending" && !data.zecTxid && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 animate-pulse" />
                  Processing
                </p>
                <p className="text-sm">
                  Your deposit is being processed by the relayer. ZEC will be sent
                  to your shielded address shortly. This page will automatically
                  update.
                </p>
              </div>
            )}
          </div>

          {/* Timestamps */}
          <div className="pt-4 border-t space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Created</span>
              <span>{new Date(data.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Last Updated</span>
              <span>{new Date(data.updatedAt).toLocaleString()}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full">
                Make Another Deposit
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
