"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useCallback, useEffect, useState } from "react";

export function useWalletAuth() {
  const { publicKey, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is authenticated (simply connected)
  useEffect(() => {
    if (connected && publicKey) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [connected, publicKey]);

  const signIn = useCallback(async () => {
    if (!publicKey || !connected) {
      setVisible(true);
      return;
    }
    // Just set authenticated - connection is enough
    setIsAuthenticated(true);
  }, [publicKey, connected, setVisible]);

  const signOut = useCallback(async () => {
    try {
      await disconnect();
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  }, [disconnect]);

  return {
    publicKey,
    connected,
    isAuthenticated,
    isLoading: false,
    signIn,
    signOut,
    session: publicKey
      ? {
          publicKey: publicKey.toString(),
          address: publicKey.toString(),
        }
      : null,
  };
}
