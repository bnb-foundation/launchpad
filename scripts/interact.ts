import { ethers } from "hardhat";

/**
 * Script for interacting with deployed BondingCurve contracts
 * Usage examples:
 *   npx hardhat run scripts/interact.ts --network bscTestnet
 */

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("==================================");
  console.log("BondingCurve Contract Interaction");
  console.log("==================================");
  console.log("Account:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "BNB");
  console.log("");

  // Replace with your deployed proxy address after deployment
  const FACTORY_PROXY_ADDRESS = process.env.FACTORY_PROXY_ADDRESS || "";

  if (!FACTORY_PROXY_ADDRESS) {
    console.error("Error: FACTORY_PROXY_ADDRESS not set!");
    console.log("Set it in .env file or pass it as environment variable:");
    console.log("  FACTORY_PROXY_ADDRESS=0x... npx hardhat run scripts/interact.ts --network bscTestnet");
    process.exit(1);
  }

  // Get factory contract
  const factory = await ethers.getContractAt("BondingCurveFactory", FACTORY_PROXY_ADDRESS);

  console.log("Factory Address:", await factory.getAddress());
  console.log("Owner:", await factory.owner());
  console.log("Fee Recipient:", await factory.feeRecipient());
  console.log("Platform Fee:", await factory.defaultPlatformFeeBps(), "bps");
  console.log("Creator Fee:", await factory.defaultCreatorFeeBps(), "bps");
  console.log("");

  // Get launch implementations
  const launchImpl = await factory.launchImplementation();
  const tokenImpl = await factory.tokenImplementation();

  console.log("Launch Implementation:", launchImpl);
  console.log("Token Implementation:", tokenImpl);
  console.log("");

  // Get all launches
  const launchCount = await factory.getAllLaunchesLength();
  console.log("Total Launches:", launchCount.toString());

  if (launchCount > 0n) {
    console.log("\nRecent Launches:");
    const displayCount = launchCount > 5n ? 5 : Number(launchCount);

    for (let i = 0; i < displayCount; i++) {
      const launchAddress = await factory.allLaunches(i);
      const launch = await ethers.getContractAt("BondingCurveLaunch", launchAddress);

      const config = await launch.config();
      const tokensSold = await launch.tokensSold();
      const graduated = await launch.graduated();
      const currentPrice = await launch.getCurrentPrice();
      const marketCap = await launch.getMarketCap();

      console.log(`\n  Launch #${i + 1}: ${launchAddress}`);
      console.log(`  Token: ${config.token}`);
      console.log(`  Name: ${config.name} (${config.symbol})`);
      console.log(`  Creator: ${config.creator}`);
      console.log(`  Tokens Sold: ${ethers.formatEther(tokensSold)} / ${ethers.formatEther(config.totalSupply)}`);
      console.log(`  Current Price: ${ethers.formatEther(currentPrice)} BNB`);
      console.log(`  Market Cap: ${ethers.formatEther(marketCap)} BNB`);
      console.log(`  Graduation Threshold: ${ethers.formatEther(config.graduationThreshold)} BNB`);
      console.log(`  Graduated: ${graduated ? "Yes ✓" : "No"}`);
    }
  } else {
    console.log("\nNo launches yet. Create one using the factory!");
  }

  console.log("\n==================================");
  console.log("Example: Create a Launch");
  console.log("==================================");
  console.log(`
  const tx = await factory.createLaunch(
    "My Token",                              // name
    "MTK",                                   // symbol
    ethers.parseEther("1000000"),           // totalSupply
    ethers.parseEther("0.0001"),            // initialPrice (0.0001 BNB)
    ethers.parseEther("0.000001"),          // priceIncrement
    ethers.parseEther("10"),                // graduationThreshold (10 BNB market cap)
    true                                    // enableSell
  );
  await tx.wait();
  `);

  console.log("==================================");
  console.log("Example: Buy Tokens");
  console.log("==================================");
  console.log(`
  const launch = await ethers.getContractAt("BondingCurveLaunch", launchAddress);

  // Calculate expected tokens for 0.1 BNB
  const bnbAmount = ethers.parseEther("0.1");
  const expectedTokens = await launch.getTokensForBnb(bnbAmount);

  // Buy with 5% slippage tolerance
  const minTokens = expectedTokens * 95n / 100n;
  const tx = await launch.buy(minTokens, { value: bnbAmount });
  await tx.wait();
  `);

  console.log("==================================");
  console.log("Example: Sell Tokens");
  console.log("==================================");
  console.log(`
  const launch = await ethers.getContractAt("BondingCurveLaunch", launchAddress);

  // Calculate expected BNB for selling 1000 tokens
  const tokenAmount = ethers.parseEther("1000");
  const expectedBnb = await launch.getBnbForTokens(tokenAmount);

  // Sell with 5% slippage tolerance
  const minBnb = expectedBnb * 95n / 100n;
  const tx = await launch.sell(tokenAmount, minBnb);
  await tx.wait();
  `);

  console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
