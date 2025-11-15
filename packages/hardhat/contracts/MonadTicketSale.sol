//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";
import "./Types.sol";

/**
 * @title MonadTicketSale
 * @notice 100% on-chain NFT ticketing system for Monad blockchain
 * @dev All seat data and ticket information stored on-chain
 * @author Monad Ticket Team
 */
contract MonadTicketSale is ERC721, Ownable {
    // ========== STATE VARIABLES ==========

    uint256 private _nextTokenId = 1;
    uint256 private _nextEventId = 1;
    uint256 private _nextTierId = 1;

    // Core mappings
    mapping(uint256 => Event) public events;
    mapping(uint256 => Tier) public tiers;

    // Seat mappings
    mapping(uint256 => string) public tokenIdToSeatId; // tokenId => "A-01"
    mapping(uint256 => mapping(string => uint256)) public eventSeatToTokenId; // (eventId, "A-01") => tokenId
    mapping(uint256 => uint256) public tokenIdToEventId; // tokenId => eventId
    mapping(uint256 => uint256) public tokenIdToTierId; // tokenId => tierId

    // Event organization
    mapping(uint256 => uint256[]) public eventTokenIds; // eventId => [tokenId1, tokenId2, ...]
    mapping(uint256 => uint256[]) public eventTierIds; // eventId => [tierId1, tierId2, ...]
    mapping(address => uint256[]) public issuerEventIds; // issuer => [eventId1, eventId2, ...]

    // All events list
    uint256[] private allEventIds;

    // Settlement system
    mapping(uint256 => uint256) public eventRevenue; // eventId => total revenue
    mapping(uint256 => bool) public eventWithdrawn; // eventId => withdrawal status
    uint256 public platformFeeBalance; // Accumulated platform fees
    uint256 public platformFeePercent = 2; // 2% platform fee

    // ========== EVENTS ==========

    event EventCreated(
        uint256 indexed eventId,
        address indexed issuer,
        string name,
        uint256 eventDate,
        uint256 totalTickets
    );

    event TierCreated(uint256 indexed tierId, uint256 indexed eventId, string name, uint256 price, uint256 totalCount);

    event TicketPurchased(
        uint256 indexed tokenId,
        uint256 indexed eventId,
        address indexed buyer,
        string seatId,
        uint256 price
    );

    event RevenueWithdrawn(uint256 indexed eventId, address indexed issuer, uint256 amount, uint256 platformFee);

    event PlatformFeeWithdrawn(address indexed owner, uint256 amount);

    // ========== CONSTRUCTOR ==========

    constructor() ERC721("MonadTicket", "MTKT") Ownable(msg.sender) {
        console.log("MonadTicketSale deployed by:", msg.sender);
    }

    // ========== MAIN FUNCTIONS ==========

    /**
     * @notice Create a new event with multiple tiers
     * @param _name Event name
     * @param _eventDate Event date (Unix timestamp)
     * @param _tierNames Array of tier names (e.g., ["VIP", "Standard"])
     * @param _tierPrices Array of tier prices (in wei)
     * @param _tierCounts Array of seat counts per tier
     * @param _tierSeatIds 2D array of seat IDs per tier (e.g., [["A-01", "A-02"], ["B-01", "B-02"]])
     */
    function createEvent(
        string memory _name,
        uint256 _eventDate,
        string[] memory _tierNames,
        uint256[] memory _tierPrices,
        uint256[] memory _tierCounts,
        string[][] memory _tierSeatIds
    ) external returns (uint256) {
        require(_tierNames.length == _tierPrices.length, "Tier data length mismatch");
        require(_tierNames.length == _tierCounts.length, "Tier data length mismatch");
        require(_tierNames.length == _tierSeatIds.length, "Tier data length mismatch");
        require(_eventDate > block.timestamp, "Event date must be in the future");

        uint256 eventId = _nextEventId++;
        uint256 totalTickets = 0;

        // Create event
        events[eventId] = Event({
            eventId: eventId,
            issuer: msg.sender,
            name: _name,
            eventDate: _eventDate,
            tierCount: _tierNames.length,
            totalTickets: 0,
            soldTickets: 0,
            isActive: true,
            createdAt: block.timestamp
        });

        // Create tiers and seats
        for (uint256 i = 0; i < _tierNames.length; i++) {
            require(_tierSeatIds[i].length == _tierCounts[i], "Seat count mismatch");

            uint256 tierId = _nextTierId++;
            uint256 startTokenId = _nextTokenId;

            tiers[tierId] = Tier({
                tierId: tierId,
                eventId: eventId,
                name: _tierNames[i],
                price: _tierPrices[i],
                totalCount: _tierCounts[i],
                soldCount: 0,
                startTokenId: startTokenId,
                createdAt: block.timestamp
            });

            eventTierIds[eventId].push(tierId);

            // Create seat mappings for each seat in this tier
            for (uint256 j = 0; j < _tierSeatIds[i].length; j++) {
                uint256 tokenId = _nextTokenId++;
                string memory seatId = _tierSeatIds[i][j];

                tokenIdToSeatId[tokenId] = seatId;
                eventSeatToTokenId[eventId][seatId] = tokenId;
                tokenIdToEventId[tokenId] = eventId;
                tokenIdToTierId[tokenId] = tierId;

                eventTokenIds[eventId].push(tokenId);
                totalTickets++;
            }

            emit TierCreated(tierId, eventId, _tierNames[i], _tierPrices[i], _tierCounts[i]);
        }

        // Update event total tickets
        events[eventId].totalTickets = totalTickets;

        // Add to tracking arrays
        allEventIds.push(eventId);
        issuerEventIds[msg.sender].push(eventId);

        emit EventCreated(eventId, msg.sender, _name, _eventDate, totalTickets);

        console.log("Event created:", eventId, "Total tickets:", totalTickets);

        return eventId;
    }

    /**
     * @notice Buy a specific ticket by seat ID
     * @param _eventId Event ID
     * @param _seatId Seat ID (e.g., "A-01")
     */
    function buyTicket(uint256 _eventId, string memory _seatId) external payable {
        require(events[_eventId].isActive, "Event not active");
        require(events[_eventId].eventDate > block.timestamp, "Event has passed");

        uint256 tokenId = eventSeatToTokenId[_eventId][_seatId];
        require(tokenId != 0, "Seat does not exist");
        require(_ownerOf(tokenId) == address(0), "Seat already sold");

        uint256 tierId = tokenIdToTierId[tokenId];
        Tier storage tier = tiers[tierId];

        require(msg.value == tier.price, "Incorrect payment amount");

        // Mint NFT to buyer
        _safeMint(msg.sender, tokenId);

        // Update counters
        tier.soldCount++;
        events[_eventId].soldTickets++;

        // Store payment in contract (settlement system)
        // Calculate platform fee (2%)
        uint256 platformFee = (msg.value * platformFeePercent) / 100;
        uint256 issuerAmount = msg.value - platformFee;

        eventRevenue[_eventId] += issuerAmount;
        platformFeeBalance += platformFee;

        emit TicketPurchased(tokenId, _eventId, msg.sender, _seatId, tier.price);

        console.log("Ticket purchased:", _seatId, "by", msg.sender);
    }

    // ========== QUERY FUNCTIONS ==========

    /**
     * @notice Get all events
     * @return Array of all events
     */
    function getAllEvents() external view returns (Event[] memory) {
        Event[] memory allEvents = new Event[](allEventIds.length);
        for (uint256 i = 0; i < allEventIds.length; i++) {
            allEvents[i] = events[allEventIds[i]];
        }
        return allEvents;
    }

    /**
     * @notice Get events by issuer
     * @param _issuer Issuer address
     * @return Array of events created by the issuer
     */
    function getEventsByIssuer(address _issuer) external view returns (Event[] memory) {
        uint256[] memory eventIds = issuerEventIds[_issuer];
        Event[] memory issuerEvents = new Event[](eventIds.length);
        for (uint256 i = 0; i < eventIds.length; i++) {
            issuerEvents[i] = events[eventIds[i]];
        }
        return issuerEvents;
    }

    /**
     * @notice Get all tiers for an event
     * @param _eventId Event ID
     * @return Array of tiers
     */
    function getEventTiers(uint256 _eventId) external view returns (Tier[] memory) {
        uint256[] memory tierIds = eventTierIds[_eventId];
        Tier[] memory eventTiers = new Tier[](tierIds.length);
        for (uint256 i = 0; i < tierIds.length; i++) {
            eventTiers[i] = tiers[tierIds[i]];
        }
        return eventTiers;
    }

    /**
     * @notice Get all seats with status for an event (for seat map visualization)
     * @param _eventId Event ID
     * @return seatIds Array of seat IDs
     * @return tokenIds Array of token IDs
     * @return owners Array of current owners (address(0) if available)
     * @return availabilities Array of availability status
     * @return prices Array of prices per seat
     * @return tierIds Array of tier IDs per seat
     */
    function getEventAllSeatsWithStatus(
        uint256 _eventId
    )
        external
        view
        returns (
            string[] memory seatIds,
            uint256[] memory tokenIds,
            address[] memory owners,
            bool[] memory availabilities,
            uint256[] memory prices,
            uint256[] memory tierIds
        )
    {
        uint256[] memory eventTokens = eventTokenIds[_eventId];
        uint256 totalSeats = eventTokens.length;

        seatIds = new string[](totalSeats);
        tokenIds = new uint256[](totalSeats);
        owners = new address[](totalSeats);
        availabilities = new bool[](totalSeats);
        prices = new uint256[](totalSeats);
        tierIds = new uint256[](totalSeats);

        for (uint256 i = 0; i < totalSeats; i++) {
            uint256 tokenId = eventTokens[i];
            uint256 tierId = tokenIdToTierId[tokenId];
            address owner = _ownerOf(tokenId);

            seatIds[i] = tokenIdToSeatId[tokenId];
            tokenIds[i] = tokenId;
            owners[i] = owner;
            availabilities[i] = (owner == address(0));
            prices[i] = tiers[tierId].price;
            tierIds[i] = tierId;
        }

        return (seatIds, tokenIds, owners, availabilities, prices, tierIds);
    }

    /**
     * @notice Get detailed seat information
     * @param _eventId Event ID
     * @param _seatId Seat ID
     * @return SeatInfo struct
     */
    function getSeatInfo(uint256 _eventId, string memory _seatId) external view returns (SeatInfo memory) {
        uint256 tokenId = eventSeatToTokenId[_eventId][_seatId];
        require(tokenId != 0, "Seat does not exist");

        uint256 tierId = tokenIdToTierId[tokenId];
        address owner = _ownerOf(tokenId);

        return
            SeatInfo({
                seatId: _seatId,
                tokenId: tokenId,
                eventId: _eventId,
                tierId: tierId,
                owner: owner,
                isAvailable: (owner == address(0)),
                price: tiers[tierId].price
            });
    }

    /**
     * @notice Check if a seat is available
     * @param _eventId Event ID
     * @param _seatId Seat ID
     * @return True if available, false if sold
     */
    function isSeatAvailable(uint256 _eventId, string memory _seatId) external view returns (bool) {
        uint256 tokenId = eventSeatToTokenId[_eventId][_seatId];
        if (tokenId == 0) return false;
        return _ownerOf(tokenId) == address(0);
    }

    /**
     * @notice Get total number of events
     */
    function getEventCount() external view returns (uint256) {
        return allEventIds.length;
    }

    /**
     * @notice Get user's owned tickets for an event
     * @param _user User address
     * @param _eventId Event ID
     * @return Array of seat IDs owned by the user
     */
    function getUserTickets(address _user, uint256 _eventId) external view returns (string[] memory) {
        uint256[] memory eventTokens = eventTokenIds[_eventId];
        uint256 ownedCount = 0;

        // Count owned tickets
        for (uint256 i = 0; i < eventTokens.length; i++) {
            if (_ownerOf(eventTokens[i]) == _user) {
                ownedCount++;
            }
        }

        // Collect seat IDs
        string[] memory ownedSeats = new string[](ownedCount);
        uint256 index = 0;
        for (uint256 i = 0; i < eventTokens.length; i++) {
            if (_ownerOf(eventTokens[i]) == _user) {
                ownedSeats[index] = tokenIdToSeatId[eventTokens[i]];
                index++;
            }
        }

        return ownedSeats;
    }

    // ========== ADMIN FUNCTIONS ==========

    /**
     * @notice Deactivate an event
     * @param _eventId Event ID
     */
    function deactivateEvent(uint256 _eventId) external {
        require(events[_eventId].issuer == msg.sender, "Not event issuer");
        events[_eventId].isActive = false;
    }

    // ========== SETTLEMENT FUNCTIONS ==========

    /**
     * @notice Withdraw event revenue after event ends
     * @param _eventId Event ID
     */
    function withdrawEventRevenue(uint256 _eventId) external {
        Event storage eventData = events[_eventId];

        require(eventData.issuer == msg.sender, "Not event issuer");
        require(block.timestamp > eventData.eventDate, "Event not ended yet");
        require(!eventWithdrawn[_eventId], "Revenue already withdrawn");
        require(eventRevenue[_eventId] > 0, "No revenue to withdraw");

        uint256 amount = eventRevenue[_eventId];
        eventWithdrawn[_eventId] = true;

        // Transfer revenue to issuer
        (bool success, ) = msg.sender.call{ value: amount }("");
        require(success, "Transfer failed");

        uint256 platformFee = (amount * platformFeePercent) / (100 - platformFeePercent);
        emit RevenueWithdrawn(_eventId, msg.sender, amount, platformFee);

        console.log("Revenue withdrawn for event:", _eventId, "Amount:", amount);
    }

    /**
     * @notice Withdraw accumulated platform fees (owner only)
     */
    function withdrawPlatformFee() external onlyOwner {
        require(platformFeeBalance > 0, "No platform fees to withdraw");

        uint256 amount = platformFeeBalance;
        platformFeeBalance = 0;

        (bool success, ) = msg.sender.call{ value: amount }("");
        require(success, "Transfer failed");

        emit PlatformFeeWithdrawn(msg.sender, amount);

        console.log("Platform fee withdrawn:", amount);
    }

    /**
     * @notice Get withdrawable revenue for an event
     * @param _eventId Event ID
     * @return amount Withdrawable amount
     */
    function getWithdrawableRevenue(uint256 _eventId) external view returns (uint256) {
        if (eventWithdrawn[_eventId]) {
            return 0;
        }
        if (block.timestamp <= events[_eventId].eventDate) {
            return 0;
        }
        return eventRevenue[_eventId];
    }

    /**
     * @notice Allow contract to receive ETH
     */
    receive() external payable {}
}
