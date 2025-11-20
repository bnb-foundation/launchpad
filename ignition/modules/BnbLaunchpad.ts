import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const BnbLaunchpadModule = buildModule("BnbLaunchpad", (m) => {
  // Deploy presale implementation (to be used as clone template)
  const presaleImplementation = m.contract("BnbPresale");

  // Deploy factory implementation
  const factoryImplementation = m.contract("BnbFactory");

  // Get deployer address for initialization
  const deployer = m.getAccount(0);

  // Encode initialization data for the factory
  const initData = m.encodeFunctionCall(factoryImplementation, "initialize", [
    presaleImplementation,
    deployer, // fee recipient
  ]);

  // Deploy ERC1967 proxy pointing to factory implementation
  const proxy = m.contract(
    "ERC1967Proxy",
    [factoryImplementation, initData],
    { id: "FactoryProxy" }
  );

  return {
    presaleImplementation,
    factoryImplementation,
    proxy,
  };
});

export default BnbLaunchpadModule;
