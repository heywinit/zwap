"use client";

import { DepositForm } from "@/components/deposit-form";
import FeeEstimator from "@/components/feeEstimator";
import ZkHealthWidget from "@/components/zkHealthWidget";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { useState, useEffect } from "react";

export default function Home() {
	const [quoteAsset, setQuoteAsset] = useState<"SOL" | "USDC">("SOL");
	const [quoteAmount, setQuoteAmount] = useState<string>("");
	const [quoteSpeed, setQuoteSpeed] = useState<"slow" | "normal" | "fast">("normal");
	const [marqueeText, setMarqueeText] = useState<string>(
		"last proof: 0ms | failure rate: 0.0% | circuit: demo | commitments: 0 | helius p50: 0 | p95: 0"
	);

	// Query zk health data for marquee
	const { data: zkHealthData } = useQuery({
		queryKey: ["admin", "zkHealth"],
		queryFn: () => trpc.admin.get.query(),
		refetchInterval: 5000,
	});

	// Update marquee text with real data
	useEffect(() => {
		if (zkHealthData) {
			const text = `last proof: ${zkHealthData.last_proof_time_ms}ms | failure rate: ${((zkHealthData.failure_rate ?? 0) * 100).toFixed(1)}% | circuit: ${(zkHealthData.circuit_id ?? "demo").slice(0, 8)} | commitments: ${zkHealthData.commitment_count} | helius p50: ${zkHealthData.helius_priority_p50} | p95: ${zkHealthData.helius_priority_p95}`;
			setMarqueeText(text);
		}
	}, [zkHealthData]);

	return (
		<div className="relative min-h-screen">
			<div className="absolute inset-0 bg-grid pointer-events-none" />
			{/* Live zk Health marquee below navbar */}
			<div className="border-b border-muted-foreground/20 bg-background/40 backdrop-blur-sm">
				<div className="px-4 py-1.5 overflow-hidden">
					<div className="animate-marquee whitespace-nowrap text-[11px] text-muted-foreground flex gap-8">
						<span>●</span>
						<span>{marqueeText}</span>
						<span>●</span>
						<span>{marqueeText}</span>
					</div>
				</div>
			</div>
			<div className="w-full h-full px-3 lg:px-6 py-2 lg:py-3">
				<div className="flex gap-5 lg:gap-6 h-full">
					{/* Left: Fees and zk Health - stacked vertically */}
					<div className="hidden lg:flex flex-1 gap-5 lg:gap-6 flex-col">
						{/* Fees calculator */}
						<div className="flex-1 fade-in">
							<FeeEstimator asset={quoteAsset} amount={quoteAmount || "0"} speed={quoteSpeed} />
						</div>
						{/* zk Health live card */}
						<div className="flex-1 fade-in">
							<ZkHealthWidget />
						</div>
					</div>
					{/* Right: Deposit - stuck to top */}
					<div className="flex-shrink-0 w-full lg:w-[35%] fade-in">
						<div className="sticky top-0">
							<DepositForm onChangeQuote={(asset, amount, speed) => { setQuoteAsset(asset); setQuoteAmount(amount); setQuoteSpeed(speed); }} />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
