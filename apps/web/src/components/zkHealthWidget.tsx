"use client";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

function statusColor(ms: number, failureRate: number, demo: boolean) {
  if (demo || ms < 200) return "text-green-600";
  if (ms <= 1000 && failureRate <= 0.1) return "text-yellow-600";
  return "text-red-600";
}

export default function ZkHealthWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "zkHealth"],
    queryFn: () => trpc.admin.get.query(),
    refetchInterval: 5000,
  });

  // Log real-time zk health data to console
  useEffect(() => {
    if (data) {
      console.log("🏥 ZK Health (Real-time):", {
        lastProofMs: data.last_proof_time_ms,
        failureRate: `${((data.failure_rate ?? 0) * 100).toFixed(1)}%`,
        circuit: data.circuit_id?.slice(0, 8) ?? "demo",
        commitments: data.commitment_count,
        relayerPool: data.relayer_pool_size,
        heliusPriority: {
          p50: `${data.helius_priority_p50 ?? 0} lamports`,
          p95: `${data.helius_priority_p95 ?? 0} lamports`,
        },
        heliusEnabled: data.helius_used ?? false,
        recentEvents: data.recent_events ?? [],
      });
    }
  }, [data]);

  const demo = (data?.circuit_id ?? "demo") === "demo";
  const color = statusColor(data?.last_proof_time_ms ?? 0, data?.failure_rate ?? 0, demo);
  const helusUsed = data?.helius_used ?? false;
  const priorityP50 = data?.helius_priority_p50 ?? 0;
  const priorityP95 = data?.helius_priority_p95 ?? 0;
  const poolSize = data?.relayer_pool_size ?? 0;
  const recent = data?.recent_events ?? [];

  return (
    <div className="fade-in">
      <Card className="px-0 py-0 shadow w-full border-none">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-muted-foreground/10">
          <span className="text-xs font-semibold">zk Health</span>
          <span className={`text-[10px] ${color}`}>{demo ? "live" : "live"}</span>
        </div>
        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <div className="space-y-1 px-3 py-2">
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">last proof</span>
              <span>{(data?.last_proof_time_ms ?? 0)} ms</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">failure rate</span>
              <span>{((data?.failure_rate ?? 0) * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">circuit</span>
              <span>{(data?.circuit_id ?? "-").slice(0, 8)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">commitments</span>
              <span>{data?.commitment_count ?? 0}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">relayer pool</span>
              <span>{poolSize}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">helius priority p50</span>
              <span>{priorityP50.toFixed(0)} lamports</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">helius priority p95</span>
              <span>{priorityP95.toFixed(0)} lamports</span>
            </div>
            <div className="text-[10px] text-muted-foreground">helius: {helusUsed ? "enabled" : "demo"}</div>
            {recent && recent.length > 0 && (
              <div className="mt-2">
                <div className="text-[10px] font-medium">recent</div>
                <div className="text-[10px] text-muted-foreground max-h-16 overflow-auto">
                  {recent.slice(0, 5).map((e: any, i: number) => (
                    <div key={i} className="flex justify-between">
                      <span>{e.type}</span>
                      <span>{e.ms}ms</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}