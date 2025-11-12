// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockPancakePair
 * @notice Mock LP token for testing
 */
contract MockPancakePair is ERC20 {
    constructor() ERC20("PancakeSwap LP", "CAKE-LP") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

/**
 * @title MockPancakeRouter
 * @notice Mock PancakeSwap router for testing
 */
contract MockPancakeRouter {
    /// @notice Mock LP token
    MockPancakePair public lpToken;

    /// @custom:error Insufficient liquidity
    error InsufficientLiquidity();

    constructor() {
        lpToken = new MockPancakePair();
    }

    /**
     * @notice Mock addLiquidityETH function
     * @param token Token address
     * @param amountTokenDesired Desired token amount
     * @param amountTokenMin Minimum token amount
     * @param amountETHMin Minimum ETH amount
     * @param to LP token recipient
     * @param deadline Transaction deadline
     * @return amountToken Token amount used
     * @return amountETH ETH amount used
     * @return liquidity LP tokens minted
     */
    function addLiquidityETH(
        address token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    )
        external
        payable
        returns (uint256 amountToken, uint256 amountETH, uint256 liquidity)
    {
        // Silence unused parameter warnings
        amountTokenMin;
        amountETHMin;
        deadline;

        if (msg.value == 0) revert InsufficientLiquidity();

        // Transfer tokens from sender
        IERC20(token).transferFrom(msg.sender, address(this), amountTokenDesired);

        // Calculate liquidity (simplified: use geometric mean)
        liquidity = sqrt(amountTokenDesired * msg.value);

        // Mint LP tokens
        lpToken.mint(to, liquidity);

        amountToken = amountTokenDesired;
        amountETH = msg.value;
    }

    /**
     * @notice Get LP token address for a pair
     * @param tokenA Token A address
     * @param tokenB Token B address
     * @return Pair address (returns our mock LP token)
     */
    function getPair(address tokenA, address tokenB)
        external
        view
        returns (address)
    {
        // Silence unused parameter warnings
        tokenA;
        tokenB;
        return address(lpToken);
    }

    /**
     * @notice Square root function for liquidity calculation
     * @param x Input value
     * @return y Square root
     */
    function sqrt(uint256 x) internal pure returns (uint256 y) {
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }

    /**
     * @notice Allow contract to receive ETH
     */
    receive() external payable {}
}
