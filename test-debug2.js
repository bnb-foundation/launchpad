const { ethers } = require("hardhat");

async function main() {
  const initialPrice = ethers.parseUnits("0.0001", 18);
  const priceIncrement = ethers.parseUnits("0.000001", 18);
  const bnbAmount = ethers.parseEther("1");
  
  console.log("initialPrice:", initialPrice.toString());
  console.log("priceIncrement:", priceIncrement.toString());
  console.log("bnbAmount:", bnbAmount.toString());
  
  const PRECISION = ethers.parseEther("1");
  console.log("PRECISION:", PRECISION.toString());
  
  // Fixed price calculation: tokens = bnbAmount / initialPrice
  // But needs to account for precision
  // tokens = (bnbAmount * PRECISION) / initialPrice
  const expectedTokens = (bnbAmount * PRECISION) / initialPrice;
  console.log("Expected tokens (if fixed price):", ethers.formatEther(expectedTokens));
  
  // The issue: initialPrice is 0.0001 BNB but it's being expressed as 0.0001 * 10^18 = 100000000000000
  // That's the price per token
  // To get tokens, we divide BNB by price
  // But we need to account for precision
  
  // Actually let's think about this:
  // price per token = 0.0001 BNB = 100000000000000 wei
  // we have 1 BNB = 1000000000000000000 wei
  // tokens = 1000000000000000000 / 100000000000000 = 10000 tokens
  
  const simpleCalc = bnbAmount / initialPrice;
  console.log("Simple calc tokens:", ethers.formatEther(simpleCalc));
}

main().catch(console.error);
