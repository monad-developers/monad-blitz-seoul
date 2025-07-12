//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./USDxToken.sol";

/**
 * A smart contract that allows minting ERC20 tokens with custom names and symbols
 * @author BuidlGuidl
 */
contract TokenMinter is Ownable {
    using SafeERC20 for IERC20;
    
    constructor() Ownable(msg.sender) {}
    // Mapping to store token addresses by name
    mapping(string => address) public tokensByName;
    
    // Array to store all created token addresses
    address[] public allTokens;
    
    // USDx 토큰 주소 (테스트용으로 생성된 USDx 토큰)
    address public usdxToken;
    
    // Events
    event TokenCreated(string name, string symbol, address tokenAddress, uint256 initialSupply, address recipient);
    event TokenDeposited(address indexed user, address indexed token, uint256 amount, uint256 usdxReceived);
    event TokenRedeemed(address indexed user, address indexed token, uint256 usdxAmount, uint256 tokenReturned);

    /**
     * Creates a new ERC20 token and mints initial supply to the recipient
     * @param _name Token name
     * @param _symbol Token symbol
     * @param _initialSupply Initial supply to mint
     * @param _recipient Address to receive the minted tokens
     */
    function createToken(
        string memory _name,
        string memory _symbol,
        uint256 _initialSupply,
        address _recipient
    ) public returns (address) {
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_symbol).length > 0, "Symbol cannot be empty");
        require(_initialSupply > 0, "Initial supply must be greater than 0");
        require(_recipient != address(0), "Recipient cannot be zero address");
        require(tokensByName[_name] == address(0), "Token with this name already exists");

        // Create new ERC20 token
        CustomToken newToken = new CustomToken(_name, _symbol, _initialSupply, _recipient);
        address tokenAddress = address(newToken);
        
        // Store token information
        tokensByName[_name] = tokenAddress;
        allTokens.push(tokenAddress);
        
        emit TokenCreated(_name, _symbol, tokenAddress, _initialSupply, _recipient);
        
        return tokenAddress;
    }

    /**
     * Get token address by name
     * @param _name Token name
     */
    function getTokenByName(string memory _name) public view returns (address) {
        return tokensByName[_name];
    }

    /**
     * Get all created token addresses
     */
    function getAllTokens() public view returns (address[] memory) {
        return allTokens;
    }

    /**
     * Get total number of created tokens
     */
    function getTokenCount() public view returns (uint256) {
        return allTokens.length;
    }

    /**
     * Set USDx token address (only owner)
     */
    function setUsdxToken(address _usdxToken) public onlyOwner {
        usdxToken = _usdxToken;
    }

    /**
     * Deposit tokens to receive USDx
     * @param _tokenAddress Address of the token to deposit
     * @param _amount Amount of tokens to deposit
     */
    function depositToken(address _tokenAddress, uint256 _amount) public {
        require(_tokenAddress != address(0), "Invalid token address");
        require(_amount > 0, "Amount must be greater than 0");
        require(usdxToken != address(0), "USDx token not set");
        
        // Transfer tokens from user to this contract
        IERC20(_tokenAddress).safeTransferFrom(msg.sender, address(this), _amount);
        
        // Calculate USDx to mint (1:1 ratio for simplicity)
        uint256 usdxAmount = _amount;
        
        // Mint USDx to user
        USDxToken(usdxToken).mint(msg.sender, usdxAmount);
        
        emit TokenDeposited(msg.sender, _tokenAddress, _amount, usdxAmount);
    }

    /**
     * Get TokenMinter contract address for approval
     */
    function getContractAddress() public view returns (address) {
        return address(this);
    }

    /**
     * Redeem USDx to get back the original token
     * @param _tokenAddress Address of the token to redeem
     * @param _usdxAmount Amount of USDx to redeem
     */
    function redeemToken(address _tokenAddress, uint256 _usdxAmount) public {
        require(_tokenAddress != address(0), "Invalid token address");
        require(_usdxAmount > 0, "Amount must be greater than 0");
        require(usdxToken != address(0), "USDx token not set");
        
        // Check if user has enough USDx
        require(IERC20(usdxToken).balanceOf(msg.sender) >= _usdxAmount, "Insufficient USDx balance");
        
        // Burn USDx from user
        IERC20(usdxToken).safeTransferFrom(msg.sender, address(this), _usdxAmount);
        USDxToken(usdxToken).burn(address(this), _usdxAmount);
        
        // Return the original token to user (1:1 ratio)
        uint256 tokenAmount = _usdxAmount;
        
        // Check if contract has enough tokens to return
        require(IERC20(_tokenAddress).balanceOf(address(this)) >= tokenAmount, "Insufficient token balance in contract");
        
        // Transfer tokens back to user
        IERC20(_tokenAddress).safeTransfer(msg.sender, tokenAmount);
        
        emit TokenRedeemed(msg.sender, _tokenAddress, _usdxAmount, tokenAmount);
    }
}

/**
 * Custom ERC20 token contract
 */
contract CustomToken is ERC20, Ownable {
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _initialSupply,
        address _recipient
    ) ERC20(_name, _symbol) Ownable(msg.sender) {
        _mint(_recipient, _initialSupply * 10**decimals());
    }

    /**
     * Mint additional tokens (only owner can call)
     * @param _to Address to receive the tokens
     * @param _amount Amount to mint
     */
    function mint(address _to, uint256 _amount) public onlyOwner {
        _mint(_to, _amount);
    }
} 