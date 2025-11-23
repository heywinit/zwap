# ZWAP Setup Script for Windows
# Run with: powershell -ExecutionPolicy Bypass -File setup.ps1

Write-Host "🚀 ZWAP Platform Setup" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "⚠️  .env file not found. Creating from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✅ Created .env file. Please update it with your configuration." -ForegroundColor Green
    Write-Host ""
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
bun install
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Start PostgreSQL
Write-Host "🐘 Starting PostgreSQL..." -ForegroundColor Cyan
docker-compose up -d
Start-Sleep -Seconds 5
Write-Host "✅ PostgreSQL started" -ForegroundColor Green
Write-Host ""

# Wait for PostgreSQL to be ready
Write-Host "⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Cyan
$maxAttempts = 30
$attempt = 0
while ($attempt -lt $maxAttempts) {
    $result = docker exec zwap-postgres pg_isready -U zwap 2>&1
    if ($LASTEXITCODE -eq 0) {
        break
    }
    Write-Host "   Waiting for database..."
    Start-Sleep -Seconds 2
    $attempt++
}
Write-Host "✅ PostgreSQL is ready" -ForegroundColor Green
Write-Host ""

# Push database schema
Write-Host "📊 Setting up database schema..." -ForegroundColor Cyan
bun run db:push
Write-Host "✅ Database schema created" -ForegroundColor Green
Write-Host ""

# Check if Anchor is installed
$anchorInstalled = Get-Command anchor -ErrorAction SilentlyContinue
if (-not $anchorInstalled) {
    Write-Host "⚠️  Anchor CLI not found. Skipping Solana program build." -ForegroundColor Yellow
    Write-Host "   Install Anchor from: https://www.anchor-lang.com/docs/installation" -ForegroundColor Yellow
    Write-Host "   Or use WSL (Windows Subsystem for Linux) for easier setup" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "🔨 Building Solana program..." -ForegroundColor Cyan
    Set-Location packages/solana
    anchor build
    Write-Host "✅ Solana program built" -ForegroundColor Green
    Set-Location ../..
    Write-Host ""
}

# Summary
Write-Host ""
Write-Host "✨ Setup Complete!" -ForegroundColor Green
Write-Host "=================="
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update .env with your Zcash RPC credentials"
Write-Host "2. Set up a Zcash testnet node (see DEPLOYMENT.md)"
Write-Host "3. Deploy Solana program: cd packages/solana; anchor deploy --provider.cluster devnet"
Write-Host "4. Update ZWAP_PROGRAM_ID in .env with deployed program ID"
Write-Host "5. Start relayer: cd packages/api; bun run src/scripts/start-relayer.ts"
Write-Host "6. Start frontend: cd apps/web; bun run dev"
Write-Host ""
Write-Host "For detailed instructions, see DEPLOYMENT.md" -ForegroundColor Yellow
Write-Host ""
