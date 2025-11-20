"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Copy, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Status = "pending" | "processing" | "completed" | "failed";

function StatusBadge({ status }: { status: Status }) {
	const config = {
		pending: { icon: Clock, label: "Pending", className: "text-muted-foreground" },
		processing: { icon: Loader2, label: "Processing", className: "text-primary animate-spin" },
		completed: { icon: CheckCircle2, label: "Completed", className: "text-primary" },
		failed: { icon: XCircle, label: "Failed", className: "text-destructive" },
	};

	const { icon: Icon, label, className } = config[status];

	return (
		<div className={`flex items-center gap-2 ${className}`}>
			<Icon className="size-4" />
			<span className="font-medium">{label}</span>
		</div>
	);
}

export default function StatusPage() {
	const params = useParams();
	const signature = params.signature as string;

	// TODO: Replace with actual tRPC query when backend is ready
	const { data: transaction, isLoading } = useQuery({
		queryKey: ["transaction", signature],
		queryFn: async () => {
			// Mock data for now
			return {
				signature,
				status: "processing" as Status,
				amount: "1.5",
				token: "SOL",
				zcashAddress: "z1...",
				solanaTx: signature,
				zcashTx: null,
				createdAt: new Date().toISOString(),
			};
		},
		refetchInterval: 5000, // Poll every 5 seconds
	});

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		toast.success("Copied to clipboard");
	};

	if (isLoading) {
		return (
			<div className="container max-w-2xl mx-auto p-4">
				<Card>
					<CardContent className="flex items-center justify-center py-12">
						<Loader2 className="size-6 animate-spin text-muted-foreground" />
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!transaction) {
		return (
			<div className="container max-w-2xl mx-auto p-4">
				<Card>
					<CardHeader>
						<CardTitle>Transaction Not Found</CardTitle>
						<CardDescription>The transaction could not be found</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}

	return (
		<div className="container max-w-2xl mx-auto p-4 space-y-4">
			<Card>
				<CardHeader>
					<CardTitle>Transaction Status</CardTitle>
					<div className="pt-2">
						<StatusBadge status={transaction.status} />
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground text-sm">Amount</span>
							<span className="font-medium">
								{transaction.amount} {transaction.token}
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground text-sm">Zcash Address</span>
							<span className="font-mono text-sm">{transaction.zcashAddress}</span>
						</div>
					</div>

					<div className="border-t pt-4 space-y-3">
						<div>
							<div className="flex items-center justify-between mb-2">
								<span className="text-muted-foreground text-sm">Solana Transaction</span>
								<div className="flex gap-2">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => copyToClipboard(transaction.solanaTx)}
									>
										<Copy className="size-3" />
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() =>
											window.open(
												`https://solscan.io/tx/${transaction.solanaTx}?cluster=devnet`,
												"_blank"
											)
										}
									>
										<ExternalLink className="size-3" />
									</Button>
								</div>
							</div>
							<code className="text-muted-foreground text-xs font-mono break-all">
								{transaction.solanaTx}
							</code>
						</div>

						{transaction.zcashTx && (
							<div>
								<div className="flex items-center justify-between mb-2">
									<span className="text-muted-foreground text-sm">Zcash Transaction</span>
									<div className="flex gap-2">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => copyToClipboard(transaction.zcashTx!)}
										>
											<Copy className="size-3" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() =>
												window.open(
													`https://zcashblockexplorer.com/tx/${transaction.zcashTx}`,
													"_blank"
												)
											}
										>
											<ExternalLink className="size-3" />
										</Button>
									</div>
								</div>
								<code className="text-muted-foreground text-xs font-mono break-all">
									{transaction.zcashTx}
								</code>
							</div>
						)}

						{!transaction.zcashTx && transaction.status === "processing" && (
							<div className="text-muted-foreground text-sm">
								Waiting for ZEC transaction to be broadcast...
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

