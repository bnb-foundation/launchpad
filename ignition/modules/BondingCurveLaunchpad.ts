import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Hardhat Ignition deployment module for BondingCurveLaunchpad
 *
 * Deployment Order:
 * 1. BondingCurveMath library
 * 2. BondingCurveLaunch implementation (linked with math library)
 * 3. StandardERC20 implementation
 * 4. BondingCurveFactory implementation
 * 5. ERC1967Proxy for factory (with initialization)
 *
 * The factory proxy is initialized with:
 * - Launch and token implementation addresses
 * - Fee recipient (deployer)
 * - Default platform fee (1% = 100 bps)
 * - Default creator fee (0.5% = 50 bps)
 */
const BondingCurveLaunchpadModule = buildModule("BondingCurveLaunchpad", (m) => {
  // Step 1: Deploy BondingCurveMath library
  // This library contains all pricing calculations for the bonding curve
  const mathLib = m.library("BondingCurveMath");

  // Step 2: Deploy BondingCurveLaunch implementation
  // This is the template contract that will be cloned for each launch
  // It requires the BondingCurveMath library to be linked
  const launchImpl = m.contract("BondingCurveLaunch", [], {
    libraries: {
      BondingCurveMath: mathLib,
    },
  });

  // Step 3: Deploy StandardERC20 implementation
  // This is the template ERC20 token contract that will be cloned for each launch
  const tokenImpl = m.contract("StandardERC20");

  // Step 4: Deploy BondingCurveFactory implementation
  // This is the main factory contract (will be behind a proxy)
  const factoryImpl = m.contract("BondingCurveFactory");

  // Step 5: Get deployer account for initialization
  const deployer = m.getAccount(0);

  // Step 6: Encode initialization data for the factory
  // Parameters:
  // - launchImpl: address of launch template
  // - tokenImpl: address of token template
  // - feeRecipient: address to receive platform fees (deployer)
  // - defaultPlatformFeeBps: 100 = 1% platform fee
  // - defaultCreatorFeeBps: 50 = 0.5% creator fee
  const initData = m.encodeFunctionCall(factoryImpl, "initialize", [
    launchImpl,
    tokenImpl,
    deployer,  // fee recipient
    100,       // 1% platform fee
    50,        // 0.5% creator fee
  ]);

  // Step 7: Deploy ERC1967 proxy pointing to factory implementation
  // This proxy allows the factory to be upgradeable via UUPS pattern
  const proxy = m.contract("ERC1967Proxy", [factoryImpl, initData], {
    id: "BondingCurveFactoryProxy",
  });

  // Return all deployed contract addresses
  // Main contract to interact with: proxy (cast to BondingCurveFactory interface)
  return {
    mathLib,
    launchImpl,
    tokenImpl,
    factoryImpl,
    proxy,
  };
});

export default BondingCurveLaunchpadModule;
