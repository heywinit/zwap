#!/bin/bash

# ZWAP Setup Script
# This script automates the initial setup of the ZWAP platform

set -e

echo "🚀 ZWAP Platform Setup"
echo "======================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env file. Please update it with your configuration.${NC}"
    echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
bun install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Start PostgreSQL
echo "🐘 Starting PostgreSQL..."
docker-compose up -d
sleep 5
echo -e "${GREEN}✅ PostgreSQL started${NC}"
echo ""

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker exec zwap-postgres pg_isready -U zwap > /dev/null 2>&1; do
    echo "   Waiting for database..."
    sleep 2
done
echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
echo ""

# Push database schema
echo "📊 Setting up database schema..."
bun run db:push
echo -e "${GREEN}✅ Database schema created${NC}"
echo ""

# Check if Anchor is installed
if ! command -v anchor &> /dev/null; then
    echo -e "${YELLOW}⚠️  Anchor CLI not found. Skipping Solana program build.${NC}"
    echo "   Install Anchor from: https://www.anchor-lang.com/docs/installation"
    echo ""
else
    echo "🔨 Building Solana program..."
    cd packages/solana
    anchor build
    echo -e "${GREEN}✅ Solana program built${NC}"
    cd ../..
    echo ""
fi

# Summary
echo ""
echo "✨ Setup Complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Update .env with your Zcash RPC credentials"
echo "2. Set up a Zcash testnet node (see DEPLOYMENT.md)"
echo "3. Deploy Solana program: cd packages/solana && anchor deploy --provider.cluster devnet"
echo "4. Update ZWAP_PROGRAM_ID in .env with deployed program ID"
echo "5. Start relayer: cd packages/api && bun run src/scripts/start-relayer.ts"
echo "6. Start frontend: cd apps/web && bun run dev"
echo ""
echo "For detailed instructions, see DEPLOYMENT.md"
echo ""
