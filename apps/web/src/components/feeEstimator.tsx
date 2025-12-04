"use client";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { Card } from "./ui/card";

type Speed = "slow" | "normal" | "fast";
export default function FeeEstimator({ asset, amount, speed = "normal" }: { asset: "SOL" | "USDC"; amount: string; speed?: Speed }) {
  const { data, refetch, isFetching } = useQuery({
    queryKey: ["quote", asset, amount, speed],
    queryFn: () => trpc.quote.get.query({ asset, amount, speed }),
    enabled: !!amount,
  });

  useEffect(() => {
    if (amount) refetch();
  }, [asset, amount, speed, refetch]);

  return (
    <Card className="p-0 border-none">
      <div className="px-3 py-2 border-b border-muted-foreground/10">
        <div className="text-xs font-semibold">Fees</div>
        <div className="text-[11px] text-muted-foreground">Estimated cost</div>
      </div>
      <div className="px-3 py-2 space-y-1 text-xs">
        <div className="flex justify-between"><span>solana fee</span><span>{((data?.solana_base_fee_estimate ?? 0) + (data?.solana_priority_fee_estimate ?? 0)).toFixed(6)} SOL</span></div>
        <div className="flex justify-between"><span>zcash shielding</span><span>{data?.zcash_shield_fee_estimate ?? 0} ZEC</span></div>
        <div className="flex justify-between"><span>privacy premium</span><span>{data?.privacy_premium ?? 0} SOL</span></div>
        <div className="flex justify-between font-semibold"><span>total</span><span>{data?.total_estimated_cost_display ? (data.total_estimated_cost_display.solana).toFixed(6) + " SOL" : "0 SOL"}</span></div>
      </div>
      {speed === "slow" && (
        <div className="text-[10px] text-yellow-500 px-3 py-1" title="may take longer or fail">may take longer or fail</div>
      )}
      <div className="text-[10px] text-muted-foreground px-3 py-1 border-t border-muted-foreground/10">why: relayer + shielding</div>
    </Card>
  );
}