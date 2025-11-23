# ZWAP Deployment Guide

This guide will help you deploy and run the ZWAP platform locally for development and testing.

## Prerequisites

- **Node.js** 18+ and **Bun** 1.2+
- **Docker** and **Docker Compose**
- **Solana CLI** and **Anchor CLI** (for Solana program deployment)
- **Zcash** node (zcashd) for testnet

## Quick Start

### 1. Install Dependencies

```bash
bun install
```

### 2. Start PostgreSQL Database

```bash
docker-compose up -d
```

Verify it's running:
```bash
docker ps
```

### 3. Set Up Environment Variables

Copy the example file and update with your values:
```bash
cp .env.example .env
```

**Important**: Update these values in `.env`:
- `ZCASH_RPC_URL` - Your zcashd RPC endpoint (default: http://localhost:18232 for testnet)
- `ZCASH_RPC_USER` - Your zcashd RPC username
- `ZCASH_RPC_PASSWORD` - Your zcashd RPC password
- `RELAYER_Z_ADDRESS` - Your relayer's shielded Z-address (create with zcashd)

### 4. Initialize Database

Push the database schema:
```bash
bun run db:push
```

### 5. Set Up Zcash Node (Testnet)

#### Option A: Using Docker (Recommended)
```bash
docker run -d \
  --name zcash-testnet \
  -p 18232:18232 \
  -v zcash-data:/root/.zcash \
  electriccoinco/zcashd:latest \
  -testnet \
  -rpcuser=zcashrpc \
  -rpcpassword=your_secure_password \
  -rpcallowip=0.0.0.0/0 \
  -rpcbind=0.0.0.0
```

#### Option B: Manual Installation
1. Download zcashd from https://z.cash/download/
2. Create `~/.zcash/zcash.conf`:
```
testnet=1
rpcuser=zcashrpc
rpcpassword=your_secure_password
rpcallowip=127.0.0.1
rpcport=18232
```
3. Start zcashd: `zcashd -daemon`

#### Create Relayer Z-Address
```bash
# Wait for zcashd to sync (this can take hours)
zcash-cli -testnet getblockchaininfo

# Create a shielded address
zcash-cli -testnet z_getnewaddress sapling

# Fund it with testnet ZEC from faucet
# Visit: https://faucet.testnet.z.cash/
```

Update `RELAYER_Z_ADDRESS` in `.env` with the generated address.

### 6. Deploy Solana Program

**Note**: Requires Anchor CLI. Install from https://www.anchor-lang.com/docs/installation

```bash
cd packages/solana

# Build the program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Copy the program ID from output
# Update ZWAP_PROGRAM_ID in .env with the deployed program ID
```

Initialize the vault:
```bash
# Use the Anchor CLI or create a script to call initialize()
anchor run initialize --provider.cluster devnet
```

### 7. Start the Relayer

In a new terminal:
```bash
cd packages/api
bun run src/scripts/start-relayer.ts
```

You should see:
```
🚀 Starting ZWAP Relayer...
📡 Monitoring program: <your_program_id>
✅ Subscribed to logs
```

### 8. Start the Frontend

In another terminal:
```bash
cd apps/web
bun run dev
```

Visit http://localhost:3000

## Testing the Full Flow

1. **Connect Wallet**: Click "Connect Wallet" and connect Phantom (set to Devnet)
2. **Get Devnet SOL**: Use Solana faucet: https://faucet.solana.com/
3. **Make a Deposit**:
   - Select SOL or USDC
   - Enter amount (e.g., 0.1 SOL)
   - Enter your Zcash testnet Z-address
   - Click "Deposit"
4. **Monitor Status**: You'll be redirected to the status page
5. **Check Relayer Logs**: Watch the relayer terminal for processing
6. **Verify ZEC Receipt**: Check your Z-address balance:
   ```bash
   zcash-cli -testnet z_getbalance <your_z_address>
   ```

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps

# View logs
docker logs zwap-postgres

# Restart
docker-compose restart
```

### Relayer Not Detecting Deposits
- Verify `ZWAP_PROGRAM_ID` matches deployed program
- Check Solana RPC connection
- Ensure relayer has correct permissions

### Zcash RPC Errors
- Verify zcashd is fully synced: `zcash-cli -testnet getblockchaininfo`
- Check RPC credentials in `.env`
- Ensure relayer Z-address has sufficient balance

### Anchor Build Fails on Windows
- Use WSL (Windows Subsystem for Linux)
- Or build on Linux/macOS
- Or use pre-built binaries

## Development Scripts

```bash
# Database
bun run db:push          # Push schema changes
bun run db:studio        # Open Drizzle Studio
bun run db:generate      # Generate migrations
bun run db:migrate       # Run migrations

# Development
bun run dev              # Start all services
bun run dev:web          # Start frontend only
bun run build            # Build all packages
bun run check            # Run linter
```

## Production Deployment

**⚠️ Warning**: This is a demo/hackathon project. For production:

1. Use mainnet Solana and Zcash
2. Implement proper key management (HSM, KMS)
3. Add monitoring and alerting
4. Implement rate limiting
5. Add retry queue for failed transactions
6. Use dynamic exchange rates from oracles
7. Conduct security audit
8. Implement multi-relayer setup for redundancy

## Support

For issues or questions:
- Check logs in relayer terminal
- Verify all environment variables are set
- Ensure all services are running
- Check database connectivity

## Architecture

```
┌─────────────┐
│   Frontend  │ (Next.js)
│  localhost  │
│    :3000    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  tRPC API   │ (Backend)
│  PostgreSQL │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│   Relayer   │────▶│   Zcash RPC │
│  (Monitor)  │     │   (zcashd)  │
└──────┬──────┘     └─────────────┘
       │
       ▼
┌─────────────┐
│   Solana    │
│   Devnet    │
└─────────────┘
```

## Next Steps

- Test full deposit flow
- Monitor relayer logs
- Check database entries
- Verify ZEC transfers
- Prepare demo script
