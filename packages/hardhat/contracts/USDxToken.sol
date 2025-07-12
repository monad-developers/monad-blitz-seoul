//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * USDx Token - Stable token for the platform
 * @author BuidlGuidl
 */
contract USDxToken is ERC20, Ownable {
    constructor() ERC20("USDx", "USDx") Ownable(msg.sender) {
        // Initial supply of 1,000,000 USDx
        _mint(msg.sender, 1000000 * 10**decimals());
    }

    /**
     * Mint additional tokens (only owner can call)
     * @param _to Address to receive the tokens
     * @param _amount Amount to mint
     */
    function mint(address _to, uint256 _amount) public onlyOwner {
        _mint(_to, _amount);
    }

    /**
     * Burn tokens (only owner can call)
     * @param _from Address to burn tokens from
     * @param _amount Amount to burn
     */
    function burn(address _from, uint256 _amount) public onlyOwner {
        _burn(_from, _amount);
    }
} 