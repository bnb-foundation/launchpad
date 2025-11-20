#!/bin/bash

# Deploy BondingCurveLaunchpad to BSC Testnet
# This script deploys the bonding curve contracts and verifies them on BscScan

set -e

echo "=================================="
echo "BondingCurve Launchpad Deployment"
echo "=================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please create .env with PRIVATE_KEY and BSCSCAN_API_KEY"
    exit 1
fi

# Load environment variables
source .env

# Check for required environment variables
if [ -z "$PRIVATE_KEY" ]; then
    echo "Error: PRIVATE_KEY not set in .env"
    exit 1
fi

if [ -z "$BSCSCAN_API_KEY" ]; then
    echo "Warning: BSCSCAN_API_KEY not set - verification will be skipped"
fi

echo "Step 1: Compiling contracts..."
npm run compile

echo ""
echo "Step 2: Deploying to BSC Testnet..."
npx hardhat ignition deploy ./ignition/modules/BondingCurveLaunchpad.ts --network bscTestnet

echo ""
echo "=================================="
echo "Deployment Complete!"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Save the deployed contract addresses from above"
echo "2. Verify contracts on BscScan using:"
echo "   npx hardhat ignition verify chain-97"
echo ""
echo "3. Update frontend/src/lib/contracts.ts with new addresses"
echo "4. Run tests: npm run test"
echo ""
