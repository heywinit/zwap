"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import bs58 from "bs58";
import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, trpc } from "@/utils/trpc";

export function useWalletAuth() {
  const { publicKey, signMessage, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Query session using React Query + tRPC client
  const { data: session } = useQuery({
    queryKey: ["auth", "getSession"],
    queryFn: () => trpc.auth.getSession.query(),
  });

  const signInMutation = useMutation({
    mutationFn: async (input: {
      publicKey: string;
      signature: string;
      message: string;
      timestamp?: number;
    }) => {
      return await trpc.auth.signIn.mutate(input);
    },
    onSuccess: async (result) => {
      if (result.success) {
        setIsAuthenticated(true);
        localStorage.setItem("solana_session", JSON.stringify(result.session));
        await queryClient.invalidateQueries({
          queryKey: ["auth", "getSession"],
        });
      }
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      return await trpc.auth.signOut.mutate();
    },
    onSuccess: async () => {
      localStorage.removeItem("solana_session");
      setIsAuthenticated(false);
      await disconnect();
      await queryClient.invalidateQueries({
        queryKey: ["auth", "getSession"],
      });
    },
  });

  // Check if user is authenticated
  useEffect(() => {
    if (session && publicKey && session.publicKey === publicKey.toString()) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [session, publicKey]);

  const signIn = useCallback(async () => {
    if (!publicKey || !signMessage) {
      setVisible(true);
      return;
    }

    try {
      // Create a message to sign
      const timestamp = Date.now();
      const message = `Sign in to ZWAP\n\nTimestamp: ${timestamp}`;

      // Request signature from wallet
      const encodedMessage = new TextEncoder().encode(message);
      const signature = await signMessage(encodedMessage);
      const signatureBase58 = bs58.encode(signature);

      // Send to backend for verification
      await signInMutation.mutateAsync({
        publicKey: publicKey.toString(),
        signature: signatureBase58,
        message,
        timestamp,
      });
    } catch (error) {
      console.error("Sign in failed:", error);
      throw error;
    }
  }, [publicKey, signMessage, setVisible, signInMutation]);

  const signOut = useCallback(async () => {
    try {
      await signOutMutation.mutateAsync();
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  }, [signOutMutation]);

  return {
    publicKey,
    connected,
    isAuthenticated,
    isLoading: signInMutation.isPending || signOutMutation.isPending,
    signIn,
    signOut,
    session,
  };
}
