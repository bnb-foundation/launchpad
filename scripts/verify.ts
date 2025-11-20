import { run } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface DeployedAddresses {
  "BnbLaunchpad#BnbPresale": string;
  "BnbLaunchpad#BnbFactory": string;
  "BnbLaunchpad#FactoryProxy": string;
}

async function main() {
  // Read deployment addresses from Ignition
  const networkName = process.env.HARDHAT_NETWORK || "bscTestnet";
  const chainId = networkName === "bscMainnet" ? 56 : 97;

  const deploymentsPath = path.join(
    __dirname,
    `../ignition/deployments/chain-${chainId}/deployed_addresses.json`
  );

  if (!fs.existsSync(deploymentsPath)) {
    console.error(`No deployments found at ${deploymentsPath}`);
    console.error("Please run deployment first: npm run deploy:testnet");
    process.exit(1);
  }

  const addresses: DeployedAddresses = JSON.parse(
    fs.readFileSync(deploymentsPath, "utf-8")
  );

  console.log("Verifying contracts on BscScan...\n");

  // Verify BnbPresale implementation
  console.log("1. Verifying BnbPresale implementation...");
  try {
    await run("verify:verify", {
      address: addresses["BnbLaunchpad#BnbPresale"],
      constructorArguments: [],
    });
    console.log("   BnbPresale verified successfully!\n");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("   BnbPresale already verified.\n");
    } else {
      console.error("   Failed to verify BnbPresale:", error.message, "\n");
    }
  }

  // Verify BnbFactory implementation
  console.log("2. Verifying BnbFactory implementation...");
  try {
    await run("verify:verify", {
      address: addresses["BnbLaunchpad#BnbFactory"],
      constructorArguments: [],
    });
    console.log("   BnbFactory verified successfully!\n");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("   BnbFactory already verified.\n");
    } else {
      console.error("   Failed to verify BnbFactory:", error.message, "\n");
    }
  }

  // Verify Proxy
  console.log("3. Verifying Factory Proxy...");
  try {
    // Get initialization data for proxy constructor args
    const BnbFactory = await (await import("hardhat")).ethers.getContractFactory("BnbFactory");
    const initData = BnbFactory.interface.encodeFunctionData("initialize", [
      addresses["BnbLaunchpad#BnbPresale"],
      process.env.FEE_RECIPIENT || addresses["BnbLaunchpad#BnbFactory"], // fallback
    ]);

    await run("verify:verify", {
      address: addresses["BnbLaunchpad#FactoryProxy"],
      constructorArguments: [
        addresses["BnbLaunchpad#BnbFactory"],
        initData,
      ],
    });
    console.log("   Factory Proxy verified successfully!\n");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("   Factory Proxy already verified.\n");
    } else {
      console.error("   Failed to verify Factory Proxy:", error.message, "\n");
    }
  }

  console.log("Verification complete!");
  console.log("\nDeployed Addresses:");
  console.log("-------------------");
  console.log(`BnbPresale Implementation: ${addresses["BnbLaunchpad#BnbPresale"]}`);
  console.log(`BnbFactory Implementation: ${addresses["BnbLaunchpad#BnbFactory"]}`);
  console.log(`Factory Proxy: ${addresses["BnbLaunchpad#FactoryProxy"]}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
