//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

/**
 * @title Types
 * @notice Data structures for MonadTicketSale contract
 */

/**
 * @dev Event structure representing a concert/show
 */
struct Event {
    uint256 eventId;
    address issuer;
    string name;
    uint256 eventDate;
    uint256 tierCount;
    uint256 totalTickets;
    uint256 soldTickets;
    bool isActive;
    uint256 createdAt;
}

/**
 * @dev Tier structure representing seat categories (VIP, Standard, etc.)
 */
struct Tier {
    uint256 tierId;
    uint256 eventId;
    string name;
    uint256 price;
    uint256 totalCount;
    uint256 soldCount;
    uint256 startTokenId;
    uint256 createdAt;
}

/**
 * @dev Seat information structure for querying
 */
struct SeatInfo {
    string seatId;
    uint256 tokenId;
    uint256 eventId;
    uint256 tierId;
    address owner;
    bool isAvailable;
    uint256 price;
}
