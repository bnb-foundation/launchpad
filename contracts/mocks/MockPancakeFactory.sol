// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MockPancakeRouter.sol";

/**
 * @title MockPancakeFactory
 * @notice Mock PancakeSwap factory for testing
 */
contract MockPancakeFactory {
    /// @notice Mapping of token pairs to LP token addresses
    mapping(address => mapping(address => address)) public pairs;

    /// @notice All created pairs
    address[] public allPairs;

    /**
     * @notice Emitted when a pair is created
     * @param token0 First token
     * @param token1 Second token
     * @param pair Pair address
     * @param pairIndex Index in allPairs array
     */
    event PairCreated(
        address indexed token0,
        address indexed token1,
        address pair,
        uint256 pairIndex
    );

    /**
     * @notice Get pair address for two tokens
     * @param tokenA First token
     * @param tokenB Second token
     * @return pair Pair address
     */
    function getPair(address tokenA, address tokenB)
        external
        view
        returns (address pair)
    {
        (address token0, address token1) = tokenA < tokenB
            ? (tokenA, tokenB)
            : (tokenB, tokenA);
        return pairs[token0][token1];
    }

    /**
     * @notice Create a new pair
     * @param tokenA First token
     * @param tokenB Second token
     * @return pair Address of created pair
     */
    function createPair(address tokenA, address tokenB)
        external
        returns (address pair)
    {
        require(tokenA != tokenB, "Identical addresses");
        (address token0, address token1) = tokenA < tokenB
            ? (tokenA, tokenB)
            : (tokenB, tokenA);
        require(token0 != address(0), "Zero address");
        require(pairs[token0][token1] == address(0), "Pair exists");

        // Deploy new LP token
        MockPancakePair lpToken = new MockPancakePair();
        pair = address(lpToken);

        // Store pair
        pairs[token0][token1] = pair;
        pairs[token1][token0] = pair;
        allPairs.push(pair);

        emit PairCreated(token0, token1, pair, allPairs.length - 1);
    }

    /**
     * @notice Get total number of pairs
     * @return Total pairs created
     */
    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }
}
