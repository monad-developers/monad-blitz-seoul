// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DataStorage {
    // Owner of the contract
    address public owner;
    
    // Mapping to store string data with string keys
    mapping(string => string) private stringData;
    
    // Mapping to store number data with string keys
    mapping(string => uint256) private numberData;
    
    // Mapping to store boolean data with string keys
    mapping(string => bool) private boolData;
    
    // Arrays to keep track of all keys for each data type
    string[] public stringKeys;
    string[] public numberKeys;
    string[] public boolKeys;
    
    // Events to log data operations
    event StringStored(string key, string value, address indexed sender);
    event NumberStored(string key, uint256 value, address indexed sender);
    event BoolStored(string key, bool value, address indexed sender);
    
    // Constructor sets the contract deployer as owner
    constructor() {
        owner = msg.sender;
    }
    
    // Modifier to restrict access to owner only
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    
    // Store string data
    function storeString(string memory _key, string memory _value) public {
        // Check if key already exists, if not add to keys array
        if (bytes(stringData[_key]).length == 0) {
            stringKeys.push(_key);
        }
        
        stringData[_key] = _value;
        emit StringStored(_key, _value, msg.sender);
    }
    
    // Retrieve string data
    function getString(string memory _key) public view returns (string memory) {
        return stringData[_key];
    }
    
    // Store number data
    function storeNumber(string memory _key, uint256 _value) public {
        // Check if key already exists, if not add to keys array
        if (numberData[_key] == 0) {
            numberKeys.push(_key);
        }
        
        numberData[_key] = _value;
        emit NumberStored(_key, _value, msg.sender);
    }
    
    // Retrieve number data
    function getNumber(string memory _key) public view returns (uint256) {
        return numberData[_key];
    }
    
    // Store boolean data
    function storeBool(string memory _key, bool _value) public {
        // Check if key already exists, if not add to keys array
        if (!boolData[_key]) {
            boolKeys.push(_key);
        }
        
        boolData[_key] = _value;
        emit BoolStored(_key, _value, msg.sender);
    }
    
    // Retrieve boolean data
    function getBool(string memory _key) public view returns (bool) {
        return boolData[_key];
    }
    
    // Get all string keys
    function getStringKeys() public view returns (string[] memory) {
        return stringKeys;
    }
    
    // Get all number keys
    function getNumberKeys() public view returns (string[] memory) {
        return numberKeys;
    }
    
    // Get all boolean keys
    function getBoolKeys() public view returns (string[] memory) {
        return boolKeys;
    }
    
    // Get total count of stored items
    function getTotalItemCount() public view returns (uint256) {
        return stringKeys.length + numberKeys.length + boolKeys.length;
    }
    
    // Owner-only function to clear all data (emergency function)
    function clearAllData() public onlyOwner {
        // Clear all mappings by deleting keys
        for (uint i = 0; i < stringKeys.length; i++) {
            delete stringData[stringKeys[i]];
        }
        for (uint i = 0; i < numberKeys.length; i++) {
            delete numberData[numberKeys[i]];
        }
        for (uint i = 0; i < boolKeys.length; i++) {
            delete boolData[boolKeys[i]];
        }
        
        // Clear key arrays
        delete stringKeys;
        delete numberKeys;
        delete boolKeys;
    }
    
    // Transfer ownership (owner only)
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        owner = newOwner;
    }
}