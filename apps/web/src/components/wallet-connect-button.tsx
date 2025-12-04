"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { toast } from "sonner";
import { useWalletAuth } from "@/hooks/use-wallet-auth";
import { Button } from "./ui/button";
import { useEffect } from "react";

export function WalletConnectButton() {
	const { publicKey, connected } = useWallet();
	const { setVisible } = useWalletModal();
	const { isAuthenticated, signIn, signOut } = useWalletAuth();

	const handleConnect = async () => {
		if (!connected) {
			setVisible(true);
			return;
		}

		if (!isAuthenticated) {
			try {
				await signIn();
				toast.success("Successfully signed in!");
			} catch (error) {
				toast.error(
					error instanceof Error ? error.message : "Failed to sign in",
				);
			}
		}
	};

	const handleDisconnect = async () => {
		try {
			await signOut();
			toast.success("Successfully signed out!");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to sign out",
			);
		}
	};

	if (!connected) {
		return (
			<Button onClick={handleConnect}>
				Connect Wallet
			</Button>
		);
	}

	if (!isAuthenticated) {
		return (
			<Button onClick={handleConnect}>
				Sign In
			</Button>
		);
	}

	return (
		<div className="flex items-center gap-2">
			<span className="text-muted-foreground text-sm">
				{publicKey?.toString().slice(0, 4)}...
				{publicKey?.toString().slice(-4)}
			</span>
			<Button onClick={handleDisconnect} variant="outline">
				Sign Out
			</Button>
		</div>
	);
}
