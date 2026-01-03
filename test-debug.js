const { ethers } = require("hardhat");

async function main() {
  const [owner, user1] = await ethers.getSigners();
  
  // Deploy token
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const token = await MockERC20.deploy("Test", "TEST", 18);
  const TOTAL_SUPPLY = ethers.parseEther("1000000");
  await token.mint(owner.address, TOTAL_SUPPLY);
  
  console.log("Owner balance:", ethers.formatEther(await token.balanceOf(owner.address)));
  
  // Deploy launch
  const BondingCurveLaunch = await ethers.getContractFactory("BondingCurveLaunch");
  const launch = await BondingCurveLaunch.deploy();
  
  // Deploy mocks
  const MockPancakeFactory = await ethers.getContractFactory("MockPancakeFactory");
  const mockFactory = await MockPancakeFactory.deploy();
  const MockPancakeRouter = await ethers.getContractFactory("MockPancakeRouter");
  const mockRouter = await MockPancakeRouter.deploy();
  const mockWBNB = await MockERC20.deploy("WBNB", "WBNB", 18);
  
  const config = {
    creator: owner.address,
    token: await token.getAddress(),
    name: "Test",
    symbol: "TEST",
    totalSupply: TOTAL_SUPPLY,
    initialPrice: ethers.parseUnits("0.0001", 18),
    priceIncrement: ethers.parseUnits("0.000001", 18),
    graduationThreshold: ethers.parseEther("50"),
    creatorFeeBps: 50,
    platformFeeBps: 100,
    enableSell: true,
  };
  
  await launch.initialize(
    config,
    owner.address,
    owner.address,
    await mockRouter.getAddress(),
    await mockFactory.getAddress(),
    await mockWBNB.getAddress()
  );
  
  // Transfer tokens to launch
  await token.transfer(await launch.getAddress(), TOTAL_SUPPLY);
  console.log("Launch balance:", ethers.formatEther(await token.balanceOf(await launch.getAddress())));
  
  // Try to buy
  const bnbAmount = ethers.parseEther("1");
  const expectedTokens = await launch.getTokensForBnb(bnbAmount);
  console.log("Expected tokens:", ethers.formatEther(expectedTokens));
  
  const tx = await launch.connect(user1).buy(0, { value: bnbAmount });
  await tx.wait();
  
  console.log("User1 token balance:", ethers.formatEther(await token.balanceOf(user1.address)));
  console.log("User1 tokenBalances mapping:", ethers.formatEther(await launch.tokenBalances(user1.address)));
  console.log("Tokens sold:", ethers.formatEther(await launch.tokensSold()));
}

main().catch(console.error);
