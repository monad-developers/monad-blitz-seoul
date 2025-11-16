// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// OpenZeppelin 패키지 기준 (npm i @openzeppelin/contracts)
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Test USD Coin (tUSDC)
/// @notice 해커톤/테스트넷용 USDC 스타일 토큰 (6 decimals, mint/burn 가능)
contract TestUSDC is ERC20, Ownable {
    /// @dev constructor에서 name/symbol 설정 + 초기 공급 민트
    /// @param initialOwner 토큰 owner (민트/번 권한 가짐)
    /// @param initialSupply 초기 공급 (정상적인 decimal 적용 전 수량, 예: 1_000_000 USDC면 1_000_000 * 10^6)
    constructor(address initialOwner, uint256 initialSupply)
        ERC20("Test USD Coin", "tUSDC")
        Ownable(initialOwner)
    {
        if (initialOwner == address(0)) {
            revert("owner is zero");
        }
        // 6 decimals 기준으로 민트
        _mint(initialOwner, initialSupply);
    }

    /// @notice USDC처럼 6 decimals 사용
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice owner가 임의 주소에 tUSDC 민트
    /// @param to 수령자
    /// @param amount 소수 적용된 양 (예: 10 USDC = 10 * 10^6)
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @notice owner가 자기 잔고를 소각
    /// @param amount 소수 적용된 양
    function burn(uint256 amount) external onlyOwner {
        _burn(_msgSender(), amount);
    }

    /// @notice owner가 특정 주소 잔고를 강제로 소각 (필요하면)
    ///         CCIP Token Pool 같은 쪽에서 쓸 수 있음
    function burnFrom(address account, uint256 amount) external onlyOwner {
        _burn(account, amount);
    }
}
