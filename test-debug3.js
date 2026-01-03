const { ethers } = require("hardhat");

async function main() {
  // Deploy BondingCurveMath library test
  const initialPrice = ethers.parseUnits("0.0001", 18); // This is actually 0.0001 * 10^18 = 1e14 wei
  const priceIncrement = ethers.parseUnits("0.000001", 18);  // This is 1e12 wei
  const bnbAmount = ethers.parseEther("1"); // 1 BNB = 1e18 wei
  const currentSupply = 0;
  
  console.log("Initial values:");
  console.log("  initialPrice:", initialPrice.toString(), "wei");
  console.log("  priceIncrement:", priceIncrement.toString(), "wei");
  console.log("  bnbAmount:", bnbAmount.toString(), "wei");
  
  // According to the bonding curve math:
  // If priceIncrement == 0, it uses: tokens = (bnbAmount * PRECISION) / initialPrice
  // But priceIncrement is NOT 0, so it uses the quadratic approach
  
  const PRECISION = ethers.parseEther("1");
  
  // Step 1: Calculate fees (as the contract does)
  const creatorFeeBps = 50;
  const platformFeeBps = 100;
  const totalFees = (bnbAmount * BigInt(creatorFeeBps + platformFeeBps)) / 10000n;
  const netAmount = bnbAmount - totalFees;
  
  console.log("\nAfter fees:");
  console.log("  totalFees:", ethers.formatEther(totalFees), "BNB");
  console.log("  netAmount:", ethers.formatEther(netAmount), "BNB");
  
  // Step 2: Calculate b = initialPrice + (priceIncrement * currentSupply) / PRECISION
  const b = initialPrice + (priceIncrement * BigInt(currentSupply)) / PRECISION;
  console.log("\nQuadratic formula b:", b.toString());
  
  // Step 3: avgPrice = b + (priceIncrement / 2)
  const avgPrice = b + (priceIncrement / 2n);
  console.log("avgPrice:", avgPrice.toString());
  
  // Step 4: Initial estimate: tokensOut = (bnbAmount * PRECISION) / avgPrice
  let tokensOut = (netAmount * PRECISION) / avgPrice;
  console.log("Initial tokensOut estimate:", ethers.formatEther(tokensOut));
  
  // The problem is clear: avgPrice is very small (around 1e14), 
  // and we're multiplying netAmount by PRECISION then dividing by avgPrice
  // netAmount ~= 0.985 * 1e18
  // PRECISION = 1e18
  // avgPrice ~= 1e14
  // result = (0.985e18 * 1e18) / 1e14 = 0.985e22 = 9850 tokens with 18 decimals = 9850000000000000000000
  
  console.log("tokensOut (raw):", tokensOut.toString());
}

main().catch(console.error);
