#!/bin/bash
# Helper script to create a Zcash shielded address for the relayer

echo "🔐 Creating Zcash shielded address..."
echo ""

# Check if container is running
if ! docker ps | grep -q zcash-testnet; then
    echo "❌ Zcash container is not running. Start it with:"
    echo "   docker start zcash-testnet"
    exit 1
fi

# Check sync status
echo "📊 Checking sync status..."
SYNC_INFO=$(docker exec zcash-testnet zcash-cli -testnet getblockchaininfo 2>&1)
if echo "$SYNC_INFO" | grep -q "couldn't connect"; then
    echo "❌ Zcash daemon is not ready. Wait a few seconds and try again."
    exit 1
fi

BLOCKS=$(echo "$SYNC_INFO" | grep -o '"blocks":[0-9]*' | cut -d: -f2)
echo "   Current blocks: $BLOCKS"
echo ""

# Try to create account (may require wallet backup acknowledgment)
echo "📝 Creating new account..."
ACCOUNT=$(docker exec zcash-testnet zcash-cli -testnet z_getnewaccount 2>&1)

if echo "$ACCOUNT" | grep -q "backed up"; then
    echo "⚠️  Wallet backup required. For testnet, you can:"
    echo "   1. Use a test address from: https://faucet.testnet.z.cash/"
    echo "   2. Or acknowledge backup (see zcashd documentation)"
    echo ""
    echo "For now, you can use any testnet Z-address (starts with 'ztest' or 'utest')"
    exit 0
fi

ACCOUNT_ID=$(echo "$ACCOUNT" | tr -d '"')
echo "✅ Account created: $ACCOUNT_ID"
echo ""

# Get address for account
echo "📍 Getting address for account $ACCOUNT_ID..."
ADDRESS=$(docker exec zcash-testnet zcash-cli -testnet z_getaddressforaccount $ACCOUNT_ID 2>&1)

if echo "$ADDRESS" | grep -q "error"; then
    echo "❌ Error: $ADDRESS"
    exit 1
fi

ADDRESS=$(echo "$ADDRESS" | tr -d '"')
echo "✅ Shielded address: $ADDRESS"
echo ""
echo "📋 Update your .env file:"
echo "   RELAYER_Z_ADDRESS=$ADDRESS"
echo ""
echo "💡 To fund this address with testnet ZEC:"
echo "   Visit: https://faucet.testnet.z.cash/"

