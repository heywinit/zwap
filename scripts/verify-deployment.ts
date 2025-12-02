#!/usr/bin/env bun

/**
 * Pre-deployment verification script
 * Checks if all required components are properly configured
 */

import { Connection, PublicKey } from "@solana/web3.js";
import { db } from "@zwap/db";
import { ZcashClient } from "@zwap/zcash";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

interface CheckResult {
	name: string;
	status: "✅ PASS" | "❌ FAIL" | "⚠️  WARN";
	message: string;
}

const results: CheckResult[] = [];

async function checkEnvironmentVariables() {
	console.log("\n📋 Checking Environment Variables...\n");

	const required = [
		"DATABASE_URL",
		"SOLANA_RPC_URL",
		"ZWAP_PROGRAM_ID",
		"ZCASH_RPC_URL",
		"ZCASH_RPC_USER",
		"ZCASH_RPC_PASSWORD",
		"RELAYER_Z_ADDRESS",
		"NEXT_PUBLIC_SOLANA_RPC_URL",
		"NEXT_PUBLIC_ZWAP_PROGRAM_ID",
	];

	for (const envVar of required) {
		if (process.env[envVar]) {
			results.push({
				name: envVar,
				status: "✅ PASS",
				message: "Set",
			});
		} else {
			results.push({
				name: envVar,
				status: "❌ FAIL",
				message: "Missing",
			});
		}
	}
}

async function checkDatabase() {
	console.log("\n🗄️  Checking Database Connection...\n");

	try {
		// Try to query the database
		await db.query.deposits.findFirst();
		results.push({
			name: "Database Connection",
			status: "✅ PASS",
			message: "Connected successfully",
		});
	} catch (error) {
		results.push({
			name: "Database Connection",
			status: "❌ FAIL",
			message:
				error instanceof Error ? error.message : "Connection failed",
		});
	}
}

async function checkSolanaRPC() {
	console.log("\n⚡ Checking Solana RPC...\n");

	try {
		const connection = new Connection(
			process.env.SOLANA_RPC_URL || "",
			"confirmed",
		);
		const version = await connection.getVersion();

		results.push({
			name: "Solana RPC",
			status: "✅ PASS",
			message: `Connected (version: ${version["solana-core"]})`,
		});

		// Check if program exists
		const programId = new PublicKey(process.env.ZWAP_PROGRAM_ID || "");
		const accountInfo = await connection.getAccountInfo(programId);

		if (accountInfo) {
			results.push({
				name: "Solana Program",
				status: "✅ PASS",
				message: `Program found at ${programId.toString()}`,
			});
		} else {
			results.push({
				name: "Solana Program",
				status: "❌ FAIL",
				message: `Program not found at ${programId.toString()}`,
			});
		}
	} catch (error) {
		results.push({
			name: "Solana RPC",
			status: "❌ FAIL",
			message: error instanceof Error ? error.message : "Connection failed",
		});
	}
}

async function checkZcashRPC() {
	console.log("\n🔐 Checking Zcash RPC...\n");

	try {
		const zcashClient = new ZcashClient({
			rpcUrl: process.env.ZCASH_RPC_URL || "",
			rpcUser: process.env.ZCASH_RPC_USER || "",
			rpcPassword: process.env.ZCASH_RPC_PASSWORD || "",
		});

		const info = await zcashClient.getBlockchainInfo();

		results.push({
			name: "Zcash RPC",
			status: "✅ PASS",
			message: `Connected (chain: ${info.chain}, blocks: ${info.blocks})`,
		});

		// Check if relayer address is valid
		const relayerAddress = process.env.RELAYER_Z_ADDRESS || "";
		const validation = await zcashClient.validateAddress(relayerAddress);

		if (validation.isvalid) {
			results.push({
				name: "Relayer Z-Address",
				status: "✅ PASS",
				message: `Valid shielded address`,
			});

			// Check balance
			try {
				const balance = await zcashClient.zGetBalance(relayerAddress);
				results.push({
					name: "Relayer Balance",
					status: balance > 0 ? "✅ PASS" : "⚠️  WARN",
					message: `${balance} ZEC`,
				});
			} catch {
				results.push({
					name: "Relayer Balance",
					status: "⚠️  WARN",
					message: "Could not fetch balance",
				});
			}
		} else {
			results.push({
				name: "Relayer Z-Address",
				status: "❌ FAIL",
				message: "Invalid address",
			});
		}
	} catch (error) {
		results.push({
			name: "Zcash RPC",
			status: "❌ FAIL",
			message: error instanceof Error ? error.message : "Connection failed",
		});
	}
}

async function checkBuild() {
	console.log("\n🔨 Checking Build Status...\n");

	try {
		// Check if packages are built
		const fs = await import("node:fs");
		const path = await import("node:path");

		const packagesToCheck = [
			"packages/solana/target/deploy/zwap.so",
			"apps/web/.next",
		];

		for (const pkg of packagesToCheck) {
			const exists = fs.existsSync(pkg);
			results.push({
				name: `Build: ${pkg}`,
				status: exists ? "✅ PASS" : "⚠️  WARN",
				message: exists ? "Built" : "Not built",
			});
		}
	} catch (error) {
		results.push({
			name: "Build Check",
			status: "⚠️  WARN",
			message: "Could not verify builds",
		});
	}
}

function printResults() {
	console.log("\n" + "=".repeat(80));
	console.log("📊 DEPLOYMENT VERIFICATION RESULTS");
	console.log("=".repeat(80) + "\n");

	for (const result of results) {
		console.log(`${result.status} ${result.name}`);
		console.log(`   ${result.message}\n`);
	}

	const failed = results.filter((r) => r.status === "❌ FAIL").length;
	const warnings = results.filter((r) => r.status === "⚠️  WARN").length;
	const passed = results.filter((r) => r.status === "✅ PASS").length;

	console.log("=".repeat(80));
	console.log(`✅ Passed: ${passed}`);
	console.log(`⚠️  Warnings: ${warnings}`);
	console.log(`❌ Failed: ${failed}`);
	console.log("=".repeat(80) + "\n");

	if (failed > 0) {
		console.log("❌ Deployment verification FAILED");
		console.log("Please fix the errors above before deploying.\n");
		process.exit(1);
	} else if (warnings > 0) {
		console.log("⚠️  Deployment verification passed with WARNINGS");
		console.log("Review warnings before deploying.\n");
		process.exit(0);
	} else {
		console.log("✅ Deployment verification PASSED");
		console.log("All systems ready for deployment!\n");
		process.exit(0);
	}
}

async function main() {
	console.log("\n🚀 ZWAP Deployment Verification");
	console.log("=".repeat(80));

	await checkEnvironmentVariables();
	await checkDatabase();
	await checkSolanaRPC();
	await checkZcashRPC();
	await checkBuild();

	printResults();
}

main().catch((error) => {
	console.error("\n❌ Fatal error during verification:", error);
	process.exit(1);
});
