"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { toast } from "sonner";
import { useWalletAuth } from "@/hooks/use-wallet-auth";
import { Button } from "./ui/button";
import { useEffect, useRef } from "react";

export function WalletConnectButton() {
	const { publicKey, connected } = useWallet();
	const { setVisible } = useWalletModal();
	const { isAuthenticated, isLoading, signIn, signOut } = useWalletAuth();
	const hasAttemptedAutoSignIn = useRef(false);

	const handleConnect = async () => {
		if (!connected) {
			hasAttemptedAutoSignIn.current = true;
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

	// Automatically sign in after wallet connects
	useEffect(() => {
		if (
			connected &&
			!isAuthenticated &&
			!isLoading &&
			hasAttemptedAutoSignIn.current &&
			publicKey
		) {
			// Small delay to ensure wallet is ready
			const timer = setTimeout(async () => {
				try {
					await signIn();
					toast.success("Successfully signed in!");
				} catch (error) {
					toast.error(
						error instanceof Error ? error.message : "Failed to sign in",
					);
				}
			}, 100);

			return () => clearTimeout(timer);
		}
	}, [connected, isAuthenticated, isLoading, publicKey, signIn]);

	// Reset the flag when disconnected
	useEffect(() => {
		if (!connected) {
			hasAttemptedAutoSignIn.current = false;
		}
	}, [connected]);

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
			<Button onClick={handleConnect} disabled={isLoading}>
				Connect Wallet
			</Button>
		);
	}

	if (!isAuthenticated) {
		return (
			<Button onClick={handleConnect} disabled={isLoading}>
				{isLoading ? "Signing in..." : "Sign In"}
			</Button>
		);
	}

	return (
		<div className="flex items-center gap-2">
			<span className="text-muted-foreground text-sm">
				{publicKey?.toString().slice(0, 4)}...
				{publicKey?.toString().slice(-4)}
			</span>
			<Button onClick={handleDisconnect} disabled={isLoading} variant="outline">
				{isLoading ? "Signing out..." : "Sign Out"}
			</Button>
		</div>
	);
}
