#!/bin/bash

# Verification script to ensure old presale contracts are removed
# and new bonding curve contracts are in place

set -e

echo "================================================"
echo "BondingCurve Migration Verification"
echo "================================================"
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if old contracts are deleted
echo "Checking for deleted presale contracts..."

DELETED_FILES=(
    "contracts/BnbPresale.sol"
    "contracts/BnbWhitelist.sol"
    "contracts/BnbFactory.sol"
    "contracts/interfaces/IBnbPresale.sol"
    "contracts/interfaces/IBnbFactory.sol"
    "test/BnbPresale.test.ts"
    "test/BnbFactory.test.ts"
    "test/BnbWhitelist.test.ts"
)

ERRORS=0

for file in "${DELETED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${RED}✗ FAIL: $file still exists (should be deleted)${NC}"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "${GREEN}✓ PASS: $file deleted${NC}"
    fi
done

echo ""
echo "Checking for new bonding curve contracts..."

REQUIRED_FILES=(
    "contracts/BondingCurveMath.sol"
    "contracts/BondingCurveLaunch.sol"
    "contracts/BondingCurveFactory.sol"
    "contracts/StandardERC20.sol"
    "contracts/interfaces/IBondingCurveLaunch.sol"
    "ignition/modules/BondingCurveLaunchpad.ts"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ PASS: $file exists${NC}"
    else
        echo -e "${RED}✗ FAIL: $file missing${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""
echo "Checking preserved contracts..."

PRESERVED_FILES=(
    "contracts/BnbVesting.sol"
    "contracts/proxy/ERC1967Proxy.sol"
)

for file in "${PRESERVED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ PASS: $file preserved${NC}"
    else
        echo -e "${YELLOW}⚠ WARNING: $file missing${NC}"
    fi
done

echo ""
echo "================================================"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All verification checks passed!${NC}"
    echo ""
    echo "Migration complete. You can now:"
    echo "1. Run: npm run compile"
    echo "2. Run: npm run test"
    echo "3. Deploy: ./scripts/deploy-bonding-curve.sh"
else
    echo -e "${RED}✗ $ERRORS verification check(s) failed!${NC}"
    exit 1
fi
echo "================================================"
