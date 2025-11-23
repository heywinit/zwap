# 🌉 ZWAP - Solana to Zcash Shielded Bridge

A cross-chain bridge that enables private transfers from Solana (SOL/USDC) to Zcash shielded addresses.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and Bun 1.2+
- Docker and Docker Compose
- Solana CLI and Anchor CLI (optional, for program deployment)

### Setup (Windows)
```powershell
# Run automated setup
bun run setup:windows

# Or manually:
bun install
docker-compose up -d
bun run db:push
```

### Setup (Linux/macOS)
```bash
# Run automated setup
chmod +x setup.sh
./setup.sh

# Or manually:
bun install
docker-compose up -d
bun run db:push
```

### Configuration

1. **Update `.env`** with your Zcash RPC credentials:
   ```env
   ZCASH_RPC_URL=http://localhost:18232
   ZCASH_RPC_USER=zcashrpc
   ZCASH_RPC_PASSWORD=your_password
   RELAYER_Z_ADDRESS=your_z_address
   ```

2. **Set up Zcash testnet node** (see [DEPLOYMENT.md](DEPLOYMENT.md))

3. **Deploy Solana program** (if not already deployed):
   ```bash
   cd packages/solana
   anchor build
   anchor deploy --provider.cluster devnet
   # Update ZWAP_PROGRAM_ID in .env
   ```

### Running

Start all services:

```bash
# Terminal 1: Start relayer
bun run relayer

# Terminal 2: Start frontend
bun run dev:web
```

Visit http://localhost:3000

## 📖 Documentation

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Detailed deployment guide
- **[doc.md](doc.md)** - Technical specification
- **[ARCHITECTURE_VERIFICATION.md](ARCHITECTURE_VERIFICATION.md)** - Architecture review

## 🏗️ Architecture

```
User Wallet (Phantom)
        ↓
    Frontend (Next.js)
        ↓
    tRPC API + PostgreSQL
        ↓
    Relayer Service
        ↓
    Solana Program ←→ Zcash RPC
```

## 🎯 Features

- ✅ SOL and USDC deposits on Solana
- ✅ Automatic ZEC transfer to shielded addresses
- ✅ Real-time status tracking
- ✅ Event-driven relayer with idempotency
- ✅ Admin recovery functions
- ✅ Type-safe API with tRPC

## 🛠️ Development

```bash
# Database
bun run db:push          # Push schema
bun run db:studio        # Open Drizzle Studio

# Development
bun run dev              # Start all services
bun run dev:web          # Frontend only
bun run relayer          # Relayer only

# Code quality
bun run check            # Lint and format
bun run check-types      # Type checking
```

## 📦 Project Structure

```
zwap/
├── apps/
│   └── web/              # Next.js frontend
├── packages/
│   ├── api/              # tRPC API + Relayer
│   ├── db/               # Database schema (Drizzle)
│   ├── solana/           # Anchor program + Client SDK
│   └── zcash/            # Zcash RPC client
├── DEPLOYMENT.md         # Deployment guide
└── setup.sh/ps1          # Setup scripts
```

## 🧪 Testing

1. Connect Phantom wallet (Devnet)
2. Get devnet SOL from https://faucet.solana.com/
3. Enter amount and Zcash Z-address
4. Submit deposit
5. Monitor status page for ZEC transfer

## ⚠️ Important Notes

- **Testnet only** - Not production-ready
- **Centralized relayer** - Single point of trust
- **Fixed exchange rates** - Hardcoded for demo
- **No atomic swaps** - Separate transactions

## 🔐 Security

This is a **hackathon/demo project**. For production:
- Implement proper key management
- Add monitoring and alerting
- Use dynamic exchange rates
- Conduct security audit
- Implement multi-relayer setup

## 📝 License

MIT

## 🤝 Contributing

This is a hackathon project. Feel free to fork and experiment!

## 🐛 Troubleshooting

**Database connection failed**
```bash
docker-compose restart
docker logs zwap-postgres
```

**Relayer not detecting deposits**
- Verify ZWAP_PROGRAM_ID matches deployed program
- Check Solana RPC connection
- Ensure program is initialized

**Zcash RPC errors**
- Verify zcashd is synced
- Check RPC credentials
- Ensure relayer Z-address has balance

For more help, see [DEPLOYMENT.md](DEPLOYMENT.md)

---

Built with ❤️ for cross-chain privacy
