"use client";

import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
	ConnectionProvider,
	WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
	LedgerWalletAdapter,
	PhantomWalletAdapter,
	SolflareWalletAdapter,
	TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { type ReactNode, useMemo } from "react";

// Import wallet adapter CSS
import "@solana/wallet-adapter-react-ui/styles.css";

interface WalletProviderProps {
	children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
	// You can also provide a custom RPC endpoint
	const network = WalletAdapterNetwork.Devnet; // Change to Mainnet when ready
	const endpoint = useMemo(() => clusterApiUrl(network), [network]);

	// Configure supported wallets with proper memoization and deduplication
	const wallets = useMemo(() => {
		const adapterList = [
			new PhantomWalletAdapter(),
			new SolflareWalletAdapter(),
			new TorusWalletAdapter(),
			new LedgerWalletAdapter(),
		];
		
		// Deduplicate by name to prevent duplicate key errors
		const seen = new Set<string>();
		return adapterList.filter((adapter) => {
			const name = adapter.name;
			if (seen.has(name)) {
				return false;
			}
			seen.add(name);
			return true;
		});
	}, []);

	return (
		<ConnectionProvider endpoint={endpoint}>
			<SolanaWalletProvider wallets={wallets} autoConnect>
				<WalletModalProvider>{children}</WalletModalProvider>
			</SolanaWalletProvider>
		</ConnectionProvider>
	);
}
