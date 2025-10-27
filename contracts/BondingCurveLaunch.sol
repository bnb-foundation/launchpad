// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IBondingCurveLaunch.sol";
import "./BondingCurveMath.sol";

/**
 * @title BondingCurveLaunch
 * @notice Implements pump.fun-style bonding curve token launch with auto-graduation
 * @dev Deployed as minimal clone (EIP-1167) by BondingCurveFactory
 *
 * Key Features:
 * - Linear bonding curve pricing (price increases with supply)
 * - Instant buy/sell trading
 * - Creator + Platform fees on all trades
 * - Automatic DEX graduation at market cap threshold
 * - LP token locking for 365 days
 * - Slippage protection on all trades
 *
 * Security:
 * - ReentrancyGuard on all external calls
 * - CEI pattern strictly enforced
 * - Pausable in emergency situations
 * - Custom errors for gas efficiency
 */
contract BondingCurveLaunch is
    Initializable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    IBondingCurveLaunch
{
    using SafeERC20 for IERC20;

    /// @notice Launch configuration (set during initialization)
    LaunchConfig public config;

    /// @notice Factory contract address
    address public factory;

    /// @notice Platform fee recipient address
    address public feeRecipient;

    /// @notice Number of tokens sold through the curve
    uint256 public tokensSold;

    /// @notice Total BNB raised (excluding fees)
    uint256 public totalBnbRaised;

    /// @notice Mapping of user addresses to their token balances
    mapping(address => uint256) public tokenBalances;

    /// @notice Whether the launch has graduated to DEX
    bool public graduated;

    /// @notice Amount of LP tokens locked
    uint256 public lpTokensLocked;

    /// @notice Timestamp when LP tokens were locked
    uint256 public lpLockTime;

    /// @notice Address of the LP token pair
    address public lpToken;

    /// @notice Accumulated creator fees (in BNB)
    uint256 public accumulatedCreatorFees;

    /// @notice Accumulated platform fees (in BNB)
    uint256 public accumulatedPlatformFees;

    /// @notice PancakeSwap V2 Router address
    address public PANCAKE_ROUTER;

    /// @notice PancakeSwap V2 Factory address
    address public PANCAKE_FACTORY;

    /// @notice Wrapped BNB address
    address public WBNB;

    /// @notice LP lock duration (365 days)
    uint256 public constant LP_LOCK_DURATION = 365 days;

    /// @notice Maximum fee in basis points (10% = 1000 bps)
    uint256 public constant MAX_FEE_BPS = 1000;

    /// @notice Basis points denominator (100% = 10000 bps)
    uint256 public constant BPS_DENOMINATOR = 10000;

    // Custom Errors (saves ~50 gas per revert)
    error AlreadyInitialized();
    error NotFactory();
    error NotCreator();
    error AlreadyGraduated();
    error NotGraduated();
    error SellDisabled();
    error InvalidAmount();
    error InsufficientBalance();
    error InsufficientLiquidity();
    error SlippageExceeded();
    error SupplyExceeded();
    error ThresholdNotMet();
    error LPStillLocked();
    error TransferFailed();
    error InvalidFee();
    error NoFeesToCollect();

    /**
     * @notice Initialize the launch contract (called once by factory)
     * @param _config Launch configuration parameters
     * @param _factory Address of the factory contract
     * @param _feeRecipient Address to receive platform fees
     * @param _pancakeRouter Address of PancakeSwap V2 Router
     * @param _pancakeFactory Address of PancakeSwap V2 Factory
     * @param _wbnb Address of Wrapped BNB
     */
    function initialize(
        LaunchConfig calldata _config,
        address _factory,
        address _feeRecipient,
        address _pancakeRouter,
        address _pancakeFactory,
        address _wbnb
    ) external initializer {
        if (_factory == address(0) || _feeRecipient == address(0)) revert InvalidAmount();
        if (_pancakeRouter == address(0) || _pancakeFactory == address(0) || _wbnb == address(0)) revert InvalidAmount();
        if (_config.creator == address(0) || _config.token == address(0)) revert InvalidAmount();
        if (_config.totalSupply == 0) revert InvalidAmount();
        if (_config.creatorFeeBps + _config.platformFeeBps > MAX_FEE_BPS) revert InvalidFee();

        __ReentrancyGuard_init();
        __Pausable_init();

        config = _config;
        factory = _factory;
        feeRecipient = _feeRecipient;
        PANCAKE_ROUTER = _pancakeRouter;
        PANCAKE_FACTORY = _pancakeFactory;
        WBNB = _wbnb;
    }

    /**
     * @notice Buy tokens with BNB (bonding curve pricing)
     * @param minTokensOut Minimum tokens expected (slippage protection)
     * @return tokensOut Amount of tokens received
     *
     * @dev Implements CEI pattern:
     * 1. Checks: not graduated, valid amount, slippage
     * 2. Effects: update state variables
     * 3. Interactions: transfer tokens, check graduation
     */
    function buy(uint256 minTokensOut)
        external
        payable
        nonReentrant
        whenNotPaused
        returns (uint256 tokensOut)
    {
        if (graduated) revert AlreadyGraduated();
        if (msg.value == 0) revert InvalidAmount();

        // Calculate fees (creator + platform)
        uint256 totalFees = (msg.value * (config.creatorFeeBps + config.platformFeeBps)) / BPS_DENOMINATOR;
        uint256 creatorFee = (msg.value * config.creatorFeeBps) / BPS_DENOMINATOR;
        uint256 platformFee = totalFees - creatorFee;
        uint256 buyAmount = msg.value - totalFees;

        // Calculate tokens using bonding curve math
        tokensOut = BondingCurveMath.calculatePurchaseReturn(
            buyAmount,
            tokensSold,
            config.initialPrice,
            config.priceIncrement
        );

        // Slippage protection
        if (tokensOut < minTokensOut) revert SlippageExceeded();
        if (tokensSold + tokensOut > config.totalSupply) revert SupplyExceeded();

        // Update state (CEI pattern - Effects)
        tokensSold += tokensOut;
        totalBnbRaised += buyAmount;
        accumulatedCreatorFees += creatorFee;
        accumulatedPlatformFees += platformFee;
        tokenBalances[msg.sender] += tokensOut;

        // Transfer tokens (CEI pattern - Interactions)
        IERC20(config.token).safeTransfer(msg.sender, tokensOut);

        emit TokensBought(msg.sender, msg.value, tokensOut, getCurrentPrice());

        // Check if graduation threshold is met
        if (getMarketCap() >= config.graduationThreshold) {
            _autoGraduate();
        }

        return tokensOut;
    }

    /**
     * @notice Sell tokens back to the curve
     * @param tokenAmount Amount of tokens to sell
     * @param minBnbOut Minimum BNB expected (slippage protection)
     * @return bnbOut Amount of BNB received
     *
     * @dev Only enabled if config.enableSell is true
     * CEI pattern enforced
     */
    function sell(uint256 tokenAmount, uint256 minBnbOut)
        external
        nonReentrant
        whenNotPaused
        returns (uint256 bnbOut)
    {
        if (graduated) revert AlreadyGraduated();
        if (!config.enableSell) revert SellDisabled();
        if (tokenAmount == 0) revert InvalidAmount();
        if (tokenBalances[msg.sender] < tokenAmount) revert InsufficientBalance();

        // Calculate BNB return using bonding curve
        uint256 bnbBeforeFees = BondingCurveMath.calculateSaleReturn(
            tokenAmount,
            tokensSold,
            config.initialPrice,
            config.priceIncrement
        );

        // Calculate fees
        uint256 totalFees = (bnbBeforeFees * (config.creatorFeeBps + config.platformFeeBps)) / BPS_DENOMINATOR;
        uint256 creatorFee = (bnbBeforeFees * config.creatorFeeBps) / BPS_DENOMINATOR;
        uint256 platformFee = totalFees - creatorFee;
        bnbOut = bnbBeforeFees - totalFees;

        // Slippage protection
        if (bnbOut < minBnbOut) revert SlippageExceeded();

        // Check contract has sufficient BNB
        uint256 availableBnb = address(this).balance - accumulatedCreatorFees - accumulatedPlatformFees;
        if (availableBnb < bnbOut) revert InsufficientLiquidity();

        // Update state (CEI pattern - Effects)
        tokensSold -= tokenAmount;
        totalBnbRaised -= bnbBeforeFees;
        accumulatedCreatorFees += creatorFee;
        accumulatedPlatformFees += platformFee;
        tokenBalances[msg.sender] -= tokenAmount;

        // Transfer tokens from seller to contract (CEI pattern - Interactions)
        IERC20(config.token).safeTransferFrom(msg.sender, address(this), tokenAmount);

        // Send BNB to seller
        (bool success, ) = msg.sender.call{value: bnbOut}("");
        if (!success) revert TransferFailed();

        emit TokensSold(msg.sender, tokenAmount, bnbOut, getCurrentPrice());

        return bnbOut;
    }

    /**
     * @notice Manually trigger graduation to DEX (if threshold met)
     * @param minLpTokens Minimum LP tokens expected (slippage protection)
     * @return lpAmount Amount of LP tokens locked
     */
    function graduateToDex(uint256 minLpTokens)
        external
        nonReentrant
        returns (uint256 lpAmount)
    {
        if (graduated) revert AlreadyGraduated();
        if (getMarketCap() < config.graduationThreshold) revert ThresholdNotMet();

        lpAmount = _autoGraduate();

        // Note: minLpTokens slippage check could be added here if needed
        // Currently graduation uses 5% slippage on addLiquidityETH
        if (lpAmount < minLpTokens) revert SlippageExceeded();

        return lpAmount;
    }

    /**
     * @notice Internal function to graduate to DEX and add liquidity
     * @dev Distributes fees before adding liquidity
     * @return lpAmount Amount of LP tokens locked
     */
    function _autoGraduate() internal returns (uint256 lpAmount) {
        graduated = true;

        // Distribute accumulated fees first
        _distributeFees();

        // Calculate liquidity amounts (use all remaining BNB)
        uint256 liquidityBnb = address(this).balance;
        uint256 liquidityTokens = IERC20(config.token).balanceOf(address(this));

        if (liquidityBnb == 0 || liquidityTokens == 0) revert InsufficientLiquidity();

        // Approve PancakeSwap router
        IERC20(config.token).safeIncreaseAllowance(PANCAKE_ROUTER, liquidityTokens);

        // Add liquidity to PancakeSwap
        // Using interface call instead of import to avoid dependency
        (bool success, bytes memory data) = PANCAKE_ROUTER.call{value: liquidityBnb}(
            abi.encodeWithSignature(
                "addLiquidityETH(address,uint256,uint256,uint256,address,uint256)",
                config.token,
                liquidityTokens,
                liquidityTokens * 95 / 100,  // 5% slippage tolerance for tokens
                liquidityBnb * 95 / 100,      // 5% slippage tolerance for BNB
                address(this),                // LP tokens sent to this contract
                block.timestamp + 300         // 5 minute deadline
            )
        );
        if (!success) revert TransferFailed();

        // Decode the returned LP token amount
        (, , lpAmount) = abi.decode(data, (uint256, uint256, uint256));

        // Get LP token pair address
        (success, data) = PANCAKE_FACTORY.call(
            abi.encodeWithSignature(
                "getPair(address,address)",
                config.token,
                WBNB
            )
        );
        if (!success) revert TransferFailed();
        lpToken = abi.decode(data, (address));

        if (lpToken == address(0)) revert TransferFailed();

        // Lock LP tokens
        lpTokensLocked = lpAmount;
        lpLockTime = block.timestamp;

        emit GraduatedToDex(liquidityBnb, liquidityTokens, lpAmount, lpToken);

        return lpAmount;
    }

    /**
     * @notice Distribute accumulated fees to creator and platform
     * @dev Internal function called during graduation
     */
    function _distributeFees() internal {
        if (accumulatedCreatorFees > 0) {
            uint256 creatorFees = accumulatedCreatorFees;
            accumulatedCreatorFees = 0;

            (bool success, ) = config.creator.call{value: creatorFees}("");
            if (!success) revert TransferFailed();

            emit FeesCollected(config.creator, creatorFees, true);
        }

        if (accumulatedPlatformFees > 0) {
            uint256 platformFees = accumulatedPlatformFees;
            accumulatedPlatformFees = 0;

            (bool success, ) = feeRecipient.call{value: platformFees}("");
            if (!success) revert TransferFailed();

            emit FeesCollected(feeRecipient, platformFees, false);
        }
    }

    /**
     * @notice Collect accumulated creator fees
     * @dev Can be called anytime by creator
     */
    function collectCreatorFees() external nonReentrant {
        if (msg.sender != config.creator) revert NotCreator();
        if (accumulatedCreatorFees == 0) revert NoFeesToCollect();

        uint256 fees = accumulatedCreatorFees;
        accumulatedCreatorFees = 0;

        (bool success, ) = config.creator.call{value: fees}("");
        if (!success) revert TransferFailed();

        emit FeesCollected(config.creator, fees, true);
    }

    /**
     * @notice Collect accumulated platform fees
     * @dev Only callable by fee recipient
     */
    function collectPlatformFees() external nonReentrant {
        if (msg.sender != feeRecipient) revert NotFactory();
        if (accumulatedPlatformFees == 0) revert NoFeesToCollect();

        uint256 fees = accumulatedPlatformFees;
        accumulatedPlatformFees = 0;

        (bool success, ) = feeRecipient.call{value: fees}("");
        if (!success) revert TransferFailed();

        emit FeesCollected(feeRecipient, fees, false);
    }

    /**
     * @notice Withdraw LP tokens after lock period
     * @dev Only callable by creator after LP_LOCK_DURATION
     */
    function withdrawLPTokens() external nonReentrant {
        if (msg.sender != config.creator) revert NotCreator();
        if (!graduated) revert NotGraduated();
        if (block.timestamp < lpLockTime + LP_LOCK_DURATION) revert LPStillLocked();
        if (lpTokensLocked == 0) revert InvalidAmount();

        uint256 amount = lpTokensLocked;
        lpTokensLocked = 0;

        IERC20(lpToken).safeTransfer(config.creator, amount);
    }

    /**
     * @notice Pause the contract (factory owner or creator)
     */
    function pause() external {
        if (msg.sender != factory && msg.sender != config.creator) revert NotFactory();
        _pause();
    }

    /**
     * @notice Unpause the contract (factory owner or creator)
     */
    function unpause() external {
        if (msg.sender != factory && msg.sender != config.creator) revert NotFactory();
        _unpause();
    }

    /**
     * @notice Get current price for the next token
     * @return Current price in wei per token
     */
    function getCurrentPrice() public view returns (uint256) {
        return BondingCurveMath.calculatePrice(
            tokensSold,
            config.initialPrice,
            config.priceIncrement
        );
    }

    /**
     * @notice Get current market capitalization
     * @return Market cap in BNB (wei)
     */
    function getMarketCap() public view returns (uint256) {
        return BondingCurveMath.calculateMarketCap(
            tokensSold,
            config.initialPrice,
            config.priceIncrement
        );
    }

    /**
     * @notice Calculate tokens receivable for given BNB amount
     * @param bnbAmount Amount of BNB (in wei)
     * @return tokenAmount Number of tokens (after fees)
     */
    function getTokensForBnb(uint256 bnbAmount) external view returns (uint256 tokenAmount) {
        if (bnbAmount == 0) return 0;

        // Calculate net amount after fees
        uint256 fees = (bnbAmount * (config.creatorFeeBps + config.platformFeeBps)) / BPS_DENOMINATOR;
        uint256 netAmount = bnbAmount - fees;

        return BondingCurveMath.calculatePurchaseReturn(
            netAmount,
            tokensSold,
            config.initialPrice,
            config.priceIncrement
        );
    }

    /**
     * @notice Calculate BNB receivable for selling tokens
     * @param tokenAmount Amount of tokens to sell
     * @return bnbAmount BNB amount (after fees)
     */
    function getBnbForTokens(uint256 tokenAmount) external view returns (uint256 bnbAmount) {
        if (tokenAmount == 0) return 0;

        uint256 bnbBeforeFees = BondingCurveMath.calculateSaleReturn(
            tokenAmount,
            tokensSold,
            config.initialPrice,
            config.priceIncrement
        );

        uint256 fees = (bnbBeforeFees * (config.creatorFeeBps + config.platformFeeBps)) / BPS_DENOMINATOR;
        return bnbBeforeFees - fees;
    }

    /**
     * @notice Check if launch has graduated to DEX
     * @return True if graduated
     */
    function isGraduated() external view returns (bool) {
        return graduated;
    }

    /**
     * @notice Check if contract is paused
     * @return True if paused
     */
    function paused() public view override(PausableUpgradeable, IBondingCurveLaunch) returns (bool) {
        return super.paused();
    }

    /**
     * @notice Receive function to accept BNB
     * @dev Required for receiving BNB from PancakeSwap and refunds
     */
    receive() external payable {
        // Allow receiving BNB only during graduation or fee distribution
        if (!graduated && msg.sender != PANCAKE_ROUTER) revert TransferFailed();
    }
}
