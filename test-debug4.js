const { ethers } = require("hardhat");

async function main() {
  const [owner, user1] = await ethers.getSigners();
  
  // Deploy BondingCurveMath library
  const BondingCurveMath = await ethers.getContractFactory("BondingCurveMath");
  const mathLib = await BondingCurveMath.deploy();
  await mathLib.waitForDeployment();
  
  const bnbAmount = ethers.parseEther("1");
  const currentSupply = 0;
  const initialPrice = ethers.parseUnits("0.0001", 18);
  const priceIncrement = ethers.parseUnits("0.000001", 18);
  
  // Call the library function directly
  try {
    const result = await mathLib.calculatePurchaseReturn(
      bnbAmount,
      currentSupply,
      initialPrice,
      priceIncrement
    );
    console.log("Library result:", ethers.formatEther(result));
  } catch (e) {
    console.error("Library error:", e.message);
  }
}

main().catch(console.error);
