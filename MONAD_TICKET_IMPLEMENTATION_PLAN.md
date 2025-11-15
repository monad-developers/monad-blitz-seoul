# MonadTicketSale.sol - 구현 계획서

## 프로젝트 개요
- **프로젝트명:** Monad-Ticket
- **목표:** 모든 데이터가 100% 온체인에 저장되는 탈중앙화 NFT 티켓 판매 디앱
- **주요 특징:** ERC-721 기반 NFT 티켓, 좌석 지정 구매, 배치도 온체인 관리

---

## 1. ERC-721 표준 구현 필요사항

### 1.1 기본 요구사항
MonadTicketSale.sol은 **ERC-721 표준**을 구현해야 하며, 다음 인터페이스를 제공해야 합니다:

#### 필수 함수 (IERC721)
| 함수명 | 파라미터 | 반환값 | 설명 |
|--------|---------|--------|------|
| `balanceOf` | `address owner` | `uint256` | 특정 주소가 소유한 NFT 개수 반환 |
| `ownerOf` | `uint256 tokenId` | `address` | tokenId의 현재 소유자 반환 |
| `safeTransferFrom` | `address from, address to, uint256 tokenId` | - | NFT 안전 전송 (ERC721Receiver 확인) |
| `transferFrom` | `address from, address to, uint256 tokenId` | - | NFT 전송 |
| `approve` | `address to, uint256 tokenId` | - | 특정 주소에 NFT 사용 권한 부여 |
| `getApproved` | `uint256 tokenId` | `address` | tokenId의 승인된 주소 반환 |
| `setApprovalForAll` | `address operator, bool approved` | - | 특정 주소에 모든 NFT 관리 권한 부여 |
| `isApprovedForAll` | `address owner, address operator` | `bool` | 모든 NFT 관리 권한 확인 |

#### 필수 이벤트 (IERC721Events)
```solidity
event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
```

#### 추가 필수 함수 (IERC721Metadata)
| 함수명 | 파라미터 | 반환값 | 설명 |
|--------|---------|--------|------|
| `name` | - | `string` | NFT 컬렉션 이름 (예: "Monad Tickets") |
| `symbol` | - | `string` | NFT 심볼 (예: "TICKET") |
| `tokenURI` | `uint256 tokenId` | `string` | 특정 NFT의 메타데이터 URI |

### 1.2 ERC-721 내부 구조
```
┌─────────────────────────────────────────────┐
│      ERC-721 Internal Mappings              │
├─────────────────────────────────────────────┤
│ mapping(uint256 => address) private _ownerOf│
│   - tokenId -> 소유자 주소                  │
│                                              │
│ mapping(address => uint256) private _balance│
│   - 주소 -> 소유한 NFT 개수                │
│                                              │
│ mapping(uint256 => address) private _approve│
│   - tokenId -> 승인된 주소                 │
│                                              │
│ mapping(address => mapping(address => bool))│
│    private _operatorApprovals               │
│   - (owner, operator) -> 권한 여부          │
└─────────────────────────────────────────────┘
```

---

## 2. Event (공연) 구조체

### 2.1 Event 구조체 정의
```solidity
struct Event {
    uint256 eventId;              // 공연 고유 ID (자동 증가)
    address issuer;               // 발행자 주소
    string name;                  // 공연명 (예: "BTS Concert 2024")
    uint256 eventDate;            // 공연 날짜 (Unix timestamp)
    uint256 tierCount;            // 등급 개수
    uint256 totalTickets;         // 전체 티켓 수
    uint256 soldTickets;          // 판매된 티켓 수
    bool isActive;                // 공연 활성 상태
    uint256 createdAt;            // 생성 시간
}
```

### 2.2 Event 관련 매핑
```solidity
// 기본 이벤트 저장소
mapping(uint256 => Event) public events;

// 발행자별 공연 ID 목록
mapping(address => uint256[]) public issuerEvents;

// 공연 ID 자동 증가 카운터
uint256 public eventIdCounter;

// 공연의 모든 Tier 저장소
mapping(uint256 => Tier[]) public eventTiers;

// 공연의 모든 좌석 tokenId 목록
mapping(uint256 => uint256[]) public eventAllSeatTokenIds;

// 공연의 모든 좌석 ID 목록 (문자열: "A-01", "B-05" 등)
mapping(uint256 => string[]) public eventAllSeatIds;
```

### 2.3 Event 쿼리 함수
| 함수명 | 파라미터 | 반환값 | 설명 |
|--------|---------|--------|------|
| `getEvent` | `uint256 eventId` | `Event memory` | 공연 정보 조회 |
| `getEventCount` | - | `uint256` | 전체 공연 개수 |
| `getIssuerEventCount` | `address issuer` | `uint256` | 특정 발행자의 공연 개수 |
| `getIssuerEventIds` | `address issuer` | `uint256[]` | 발행자의 모든 공연 ID 배열 |
| `getEventTierCount` | `uint256 eventId` | `uint256` | 특정 공연의 등급 개수 |

---

## 3. Tier (좌석 등급) 구조체

### 3.1 Tier 구조체 정의
```solidity
struct Tier {
    uint256 tierId;               // 등급 고유 ID (공연별 자동 증가)
    uint256 eventId;              // 소속 공연 ID
    string name;                  // 등급명 (예: "VIP", "Standard", "Economy")
    uint256 price;                // 티켓 가격 (Wei 단위)
    uint256 totalCount;           // 이 등급의 총 좌석 수
    uint256 soldCount;            // 판매된 좌석 수
    uint256 startTokenId;         // 이 등급 시작 NFT ID
    uint256 createdAt;            // 생성 시간
}
```

### 3.2 Tier 관련 매핑
```solidity
// 공연별 Tier 저장소 (이미 위에서 정의)
// mapping(uint256 => Tier[]) public eventTiers;

// tokenId -> 소속 Tier 정보 (빠른 조회용)
mapping(uint256 => TierInfo) public tokenIdToTier;

struct TierInfo {
    uint256 eventId;
    uint256 tierId;
}
```

### 3.3 Tier 쿼리 함수
| 함수명 | 파라미터 | 반환값 | 설명 |
|--------|---------|--------|------|
| `getTier` | `uint256 eventId, uint256 tierId` | `Tier memory` | 특정 등급 정보 조회 |
| `getEventTiers` | `uint256 eventId` | `Tier[] memory` | 공연의 모든 등급 조회 |
| `getTierByTokenId` | `uint256 tokenId` | `Tier memory` | tokenId로부터 소속 Tier 조회 |
| `getTierAvailableCount` | `uint256 eventId, uint256 tierId` | `uint256` | 특정 등급의 남은 좌석 수 |

---

## 4. Seat (좌석) 관리 시스템

### 4.1 핵심 설계 원칙
- **Seat는 별도 구조체가 아님**
- **Seat 정보는 매핑 조합으로 관리**
- **모든 데이터가 100% 온체인에 저장**

### 4.2 필수 매핑 (Seat 관리)

#### A. tokenIdToSeatId (tokenId → 좌석 번호 문자열)
```solidity
mapping(uint256 => string) public tokenIdToSeatId;

// 용도: tokenId가 주어졌을 때, 그 좌석의 ID 문자열 조회
// 예: tokenId 1000 -> "A-01"
```

#### B. eventSeatToTokenId (Event + 좌석ID → tokenId)
```solidity
mapping(uint256 => mapping(string => uint256)) public eventSeatToTokenId;

// 용도: 특정 공연의 특정 좌석 번호로부터 tokenId 조회
// 예: (eventId 1, "A-01") -> tokenId 1000
```

#### C. ownerOf (ERC-721 표준)
```solidity
mapping(uint256 => address) private _ownerOf;

// 용도: tokenId의 현재 소유자 조회 (또는 미판매 상태 확인)
// 예: tokenId 1000의 소유자는 0x123... 또는 address(0) (미판매)
```

#### D. 추가 필요 매핑

##### D1. seatToEventAndTier (좌석 세부정보)
```solidity
struct SeatInfo {
    uint256 eventId;              // 소속 공연 ID
    uint256 tierId;               // 소속 등급 ID
    bool isSold;                  // 판매 상태
}

mapping(uint256 => SeatInfo) public tokenIdToSeatInfo;

// 용도: tokenId로부터 공연, 등급, 판매상태 한번에 조회
```

##### D2. eventSeatToPrice (좌석 가격)
```solidity
mapping(uint256 => mapping(string => uint256)) public eventSeatToPrice;

// 용도: 공연별, 좌석별 가격 조회 (Tier의 price와 동일하지만 빠른 접근용)
```

### 4.3 온체인 좌석 배치도 구조

#### 4.3.1 공연별 좌석 목록 저장소
```solidity
// 공연의 모든 좌석 tokenId 배열 (이미 위에서 정의)
mapping(uint256 => uint256[]) public eventAllSeatTokenIds;

// 공연의 모든 좌석 ID 배열 (문자열)
mapping(uint256 => string[]) public eventAllSeatIds;
```

#### 4.3.2 좌석 배치도 조회 메커니즘
클라이언트는 다음과 같이 전체 좌석 배치도를 구성할 수 있음:

```
1. getEventAllSeatIds(eventId) -> ["A-01", "A-02", ..., "Z-50"]
   ↓
2. For each seatId:
   - ownerOf(eventSeatToTokenId[eventId][seatId])
   - 반환값이 address(0) → 미판매
   - 반환값이 특정 주소 → 판매됨 (주소가 소유자)
   ↓
3. 웹UI에서 시각적 배치도 렌더링
```

### 4.4 Seat 쿼리 함수
| 함수명 | 파라미터 | 반환값 | 설명 |
|--------|---------|--------|------|
| `getSeatId` | `uint256 tokenId` | `string` | tokenId의 좌석 번호 조회 |
| `getSeatTokenId` | `uint256 eventId, string seatId` | `uint256` | 공연과 좌석ID로 tokenId 조회 |
| `getSeatInfo` | `uint256 tokenId` | `string eventId, tierId, isSold` | 좌석 세부정보 조회 |
| `isSeatAvailable` | `uint256 eventId, string seatId` | `bool` | 특정 좌석 구매 가능 여부 |
| `getEventAllSeats` | `uint256 eventId` | `string[] memory` | 공연의 모든 좌석 ID 조회 |
| `getEventSeatStatuses` | `uint256 eventId` | `SeatStatus[] memory` | 공연의 모든 좌석과 소유자 상태 조회 |

#### SeatStatus 구조체
```solidity
struct SeatStatus {
    string seatId;                // 좌석 번호
    uint256 tokenId;              // 해당 NFT tokenId
    address owner;                // 현재 소유자 (address(0)면 미판매)
    uint256 price;                // 좌석 가격
}
```

---

## 5. 필수 함수 목록

### 5.1 Event 관리 함수

#### createEvent
```solidity
function createEvent(
    string calldata _eventName,
    uint256 _eventDate,
    string[] calldata _tierNames,
    uint256[] calldata _tierPrices,
    uint256[] calldata _tierTotalCounts
) external returns (uint256 eventId)
```
**파라미터:**
- `_eventName`: 공연명 (예: "BTS Concert 2024")
- `_eventDate`: 공연 날짜 (Unix timestamp)
- `_tierNames`: 각 등급의 이름 배열 (예: ["VIP", "Standard", "Economy"])
- `_tierPrices`: 각 등급의 가격 배열 (Wei 단위)
- `_tierTotalCounts`: 각 등급의 총 좌석 수 배열

**동작:**
1. 새로운 Event 생성 (eventId 자동 증가)
2. 발행자(msg.sender)를 Event.issuer로 설정
3. 각 Tier 생성 (tierId는 Tier별 자동 증가)
4. 모든 좌석에 대한 NFT tokenId 사전 할당 및 좌석 번호 생성
5. 좌석 ID 문자열 자동 생성 (예: "A-01", "A-02", "B-01" 등)
6. 모든 매핑에 데이터 저장
7. EventCreated 이벤트 발생
8. 새로운 eventId 반환

**반환값:** 새로 생성된 eventId

**이벤트:**
```solidity
event EventCreated(
    uint256 indexed eventId,
    address indexed issuer,
    string eventName,
    uint256 eventDate,
    uint256 totalTickets
);
```

#### addTier (옵션)
```solidity
function addTier(
    uint256 _eventId,
    string calldata _tierName,
    uint256 _tierPrice,
    uint256 _tierTotalCount
) external returns (uint256 tierId)
```
**파라미터:**
- `_eventId`: 대상 공연 ID
- `_tierName`: 새 등급명
- `_tierPrice`: 가격 (Wei)
- `_tierTotalCount`: 좌석 수

**동작:**
1. Event가 존재하는지 확인
2. 발행자(msg.sender)가 일치하는지 확인
3. 새로운 Tier 생성
4. 새로운 좌석들에 대한 NFT tokenId 할당
5. 좌석 ID 문자열 생성
6. 모든 매핑에 데이터 저장
7. TierAdded 이벤트 발생

**반환값:** 새로 생성된 tierId

---

### 5.2 티켓 구매 함수

#### buyTicket
```solidity
function buyTicket(
    uint256 _eventId,
    string calldata _seatId
) external payable returns (uint256 tokenId)
```
**파라미터:**
- `_eventId`: 구매할 공연 ID
- `_seatId`: 원하는 좌석 번호 (예: "A-01")

**동작:**
1. Event가 존재하는지 확인
2. 좌석이 존재하는지 확인 (eventSeatToTokenId에 있는지)
3. 좌석이 미판매 상태인지 확인 (ownerOf == address(0))
4. 전송된 ETH가 좌석 가격 이상인지 확인 (msg.value >= price)
5. tokenId 계산: `uint256 tokenId = eventSeatToTokenId[_eventId][_seatId]`
6. NFT 발행: _ownerOf[tokenId] = msg.sender
7. Tier.soldCount 증가
8. Event.soldTickets 증가
9. 초과 지불액 반환 (msg.value > price인 경우)
10. TicketPurchased 이벤트 발생
11. tokenId 반환

**반환값:** 구매한 NFT의 tokenId

**이벤트:**
```solidity
event TicketPurchased(
    uint256 indexed eventId,
    uint256 indexed tokenId,
    string seatId,
    address indexed buyer,
    uint256 price
);
```

**에러 처리:**
- `Event not found`: Event가 존재하지 않을 때
- `Event not active`: Event가 활성화되지 않았을 때
- `Seat not found`: 좌석이 존재하지 않을 때
- `Seat already sold`: 좌석이 이미 판매되었을 때
- `Insufficient payment`: 지불액이 부족할 때

---

### 5.3 ERC-721 구현 함수 (필수)

#### balanceOf
```solidity
function balanceOf(address _owner) external view returns (uint256)
```
**설명:** 특정 주소가 소유한 NFT 개수 반환
**동작:** _balance[_owner] 반환

#### ownerOf
```solidity
function ownerOf(uint256 _tokenId) external view returns (address)
```
**설명:** tokenId의 현재 소유자 반환
**동작:** _ownerOf[_tokenId] 반환 (없으면 revert)

#### name
```solidity
function name() external pure returns (string memory)
```
**반환:** "Monad Tickets"

#### symbol
```solidity
function symbol() external pure returns (string memory)
```
**반환:** "TICKET"

#### tokenURI
```solidity
function tokenURI(uint256 _tokenId) external view returns (string memory)
```
**설명:** 특정 NFT의 메타데이터 URI 반환
**동작:** tokenId가 유효한지 확인 후, 메타데이터 URI 반환

#### approve
```solidity
function approve(address _to, uint256 _tokenId) external
```
**파라미터:**
- `_to`: 승인할 주소
- `_tokenId`: 대상 NFT tokenId

**동작:**
1. 호출자(msg.sender)가 tokenId의 소유자이거나 operatorApprovals 확인
2. _approve[_tokenId] = _to
3. Approval 이벤트 발생

#### getApproved
```solidity
function getApproved(uint256 _tokenId) external view returns (address)
```
**설명:** tokenId의 승인된 주소 반환

#### setApprovalForAll
```solidity
function setApprovalForAll(address _operator, bool _approved) external
```
**파라미터:**
- `_operator`: 승인할 주소
- `_approved`: 승인 여부

**동작:**
1. _operatorApprovals[msg.sender][_operator] = _approved
2. ApprovalForAll 이벤트 발생

#### isApprovedForAll
```solidity
function isApprovedForAll(address _owner, address _operator) external view returns (bool)
```
**설명:** 특정 주소가 모든 NFT 관리 권한이 있는지 확인

#### transferFrom
```solidity
function transferFrom(address _from, address _to, uint256 _tokenId) external
```
**파라미터:**
- `_from`: 현재 소유자
- `_to`: 수신자
- `_tokenId`: 전송할 NFT tokenId

**동작:**
1. tokenId 유효성 확인
2. msg.sender가 소유자이거나 승인된 주소 또는 operator인지 확인
3. _ownerOf[_tokenId] = _to
4. _balance[_from] 감소
5. _balance[_to] 증가
6. _approve[_tokenId] = address(0) (승인 초기화)
7. Transfer 이벤트 발생

#### safeTransferFrom (1개 파라미터)
```solidity
function safeTransferFrom(address _from, address _to, uint256 _tokenId) external
```
**동작:** transferFrom 동작 + ERC721Receiver 확인

#### safeTransferFrom (2개 파라미터)
```solidity
function safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes memory _data) external
```
**동작:** transferFrom 동작 + ERC721Receiver 확인 (data 포함)

---

### 5.4 쿼리 함수 (조회용, gas 소비 없음)

#### Event 조회 함수
| 함수명 | 파라미터 | 반환값 | 설명 |
|--------|---------|--------|------|
| `getEvent` | `uint256 eventId` | `Event` | 특정 공연 정보 |
| `getEventCount` | - | `uint256` | 전체 공연 개수 |
| `getIssuerEventCount` | `address issuer` | `uint256` | 발행자의 공연 개수 |
| `getIssuerEventIds` | `address issuer` | `uint256[]` | 발행자의 공연 ID 배열 |
| `isEventActive` | `uint256 eventId` | `bool` | 공연 활성 상태 |

#### Tier 조회 함수
| 함수명 | 파라미터 | 반환값 | 설명 |
|--------|---------|--------|------|
| `getTier` | `uint256 eventId, uint256 tierId` | `Tier` | 특정 등급 정보 |
| `getEventTiers` | `uint256 eventId` | `Tier[]` | 공연의 모든 등급 |
| `getEventTierCount` | `uint256 eventId` | `uint256` | 공연의 등급 개수 |

#### Seat 조회 함수
| 함수명 | 파라미터 | 반환값 | 설명 |
|--------|---------|--------|------|
| `getSeatId` | `uint256 tokenId` | `string` | tokenId의 좌석 번호 |
| `getSeatTokenId` | `uint256 eventId, string seatId` | `uint256` | 좌석 번호로 tokenId 조회 |
| `getSeatInfo` | `uint256 tokenId` | `SeatInfo` | 좌석의 이벤트, 등급, 판매상태 |
| `isSeatAvailable` | `uint256 eventId, string seatId` | `bool` | 좌석 구매 가능 여부 |
| `getEventAllSeats` | `uint256 eventId` | `string[]` | 공연의 모든 좌석 ID |
| `getSeatPrice` | `uint256 eventId, string seatId` | `uint256` | 좌석 가격 |
| `getEventSeatStatuses` | `uint256 eventId` | `SeatStatus[]` | 공연의 모든 좌석 상태 (소유자 포함) |

---

## 6. 이벤트 (Events) 정의

### 필수 이벤트 목록
```solidity
// ERC-721 표준 이벤트
event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

// Monad Ticket 커스텀 이벤트
event EventCreated(
    uint256 indexed eventId,
    address indexed issuer,
    string eventName,
    uint256 eventDate,
    uint256 totalTickets
);

event TierAdded(
    uint256 indexed eventId,
    uint256 indexed tierId,
    string tierName,
    uint256 price,
    uint256 totalCount
);

event TicketPurchased(
    uint256 indexed eventId,
    uint256 indexed tokenId,
    string seatId,
    address indexed buyer,
    uint256 price
);

event SeatAssigned(
    uint256 indexed eventId,
    uint256 indexed tokenId,
    string seatId,
    uint256 tierId
);
```

---

## 7. 데이터 흐름 예시

### 7.1 공연 생성 시나리오

```
Issuer (발행자)
  │
  ├─> createEvent(
  │      "BTS Concert 2024",
  │      1704067200,  // 2024-01-01
  │      ["VIP", "Standard"],
  │      [1000000000000000000, 500000000000000000],  // 1 ETH, 0.5 ETH
  │      [50, 100]  // 50석, 100석
  │   )
  │
  ├─> 내부 동작:
  │    1. eventId = 1, Event 생성
  │    2. VIP Tier 생성 (tierId = 1, totalCount = 50)
  │       - tokenId 1~50 할당
  │       - seatId "A-01"~"A-50" 생성
  │    3. Standard Tier 생성 (tierId = 2, totalCount = 100)
  │       - tokenId 51~150 할당
  │       - seatId "B-01"~"B-100" 생성
  │    4. 모든 매핑 업데이트
  │    5. EventCreated 이벤트 발생
  │
  └─> 반환: eventId = 1
```

### 7.2 티켓 구매 시나리오

```
Buyer (구매자)
  │
  ├─> buyTicket(
  │      1,  // eventId
  │      "A-01",  // seatId
  │      { value: 1.5 ETH }
  │   )
  │
  ├─> 내부 동작:
  │    1. Event 확인: eventId = 1 존재? ✓
  │    2. Seat 확인: "A-01" 존재? ✓
  │    3. 구매 가능 확인: ownerOf(1) == address(0)? ✓
  │    4. 가격 확인: msg.value >= 1 ETH? ✓ (1.5 >= 1)
  │    5. tokenId 계산: tokenId = eventSeatToTokenId[1]["A-01"] = 1
  │    6. NFT 발행: _ownerOf[1] = msg.sender (구매자 주소)
  │    7. _balance[msg.sender]++ (NFT 개수 증가)
  │    8. VIP Tier soldCount++
  │    9. Event soldTickets++
  │   10. 초과액 반환: 1.5 - 1 = 0.5 ETH 환급
  │   11. TicketPurchased 이벤트 발생
  │
  └─> 반환: tokenId = 1
```

### 7.3 좌석 배치도 조회 시나리오

```
Frontend (웹 클라이언트)
  │
  ├─> getEventAllSeats(1)
  │    └─> 반환: ["A-01", "A-02", ..., "A-50", "B-01", ..., "B-100"]
  │
  ├─> For each seatId in seats:
  │    ├─> getSeatTokenId(1, seatId) → tokenId
  │    ├─> ownerOf(tokenId) → owner (소유자 주소 또는 address(0))
  │    ├─> getSeatPrice(1, seatId) → price
  │    └─> isAvailable = (owner == address(0))
  │
  ├─> 데이터 구조 (배치도):
  │    [
  │      { seatId: "A-01", tokenId: 1, owner: "0x123...", price: "1 ETH", available: false },
  │      { seatId: "A-02", tokenId: 2, owner: null, price: "1 ETH", available: true },
  │      ...
  │    ]
  │
  └─> UI 렌더링: 배치도 그리기 (판매됨/판매 가능 상태 표시)
```

---

## 8. 에러 처리 및 Revert 메시지

### 필수 검증
```solidity
require(eventExists(eventId), "MonadTicket: Event not found");
require(events[eventId].isActive, "MonadTicket: Event not active");
require(eventSeatToTokenId[eventId][seatId] != 0, "MonadTicket: Seat not found");
require(ownerOf(tokenId) == address(0), "MonadTicket: Seat already sold");
require(msg.value >= price, "MonadTicket: Insufficient payment");
require(msg.sender == events[eventId].issuer, "MonadTicket: Only issuer can create tiers");
require(to != address(0), "MonadTicket: Invalid transfer to zero address");
require(ownerOf(tokenId) == msg.sender, "MonadTicket: Not authorized to transfer");
```

---

## 9. 배포 체크리스트

- [ ] ERC-721 표준 완전 구현
- [ ] Event 구조체 및 매핑 구현
- [ ] Tier 구조체 및 매핑 구현
- [ ] 좌석 배치도 온체인 저장 및 조회 시스템 구현
- [ ] createEvent 함수 구현 (좌석 자동 생성)
- [ ] buyTicket 함수 구현
- [ ] 모든 쿼리 함수 구현
- [ ] 이벤트 발생 구현
- [ ] 에러 처리 완료
- [ ] 단위 테스트 작성 및 통과
- [ ] 가스 최적화 검토
- [ ] 보안 감사 (reentrancy, overflow/underflow 등)
- [ ] Monad 테스트넷 배포 및 검증

---

## 10. 주요 설계 원칙

1. **100% 온체인 데이터**
   - 모든 좌석 정보, 배치도, 판매 상태가 블록체인에 기록됨
   - 클라이언트는 컨트랙트 호출만으로 전체 데이터 조회 가능

2. **ERC-721 표준 준수**
   - 표준 인터페이스로 다른 지갑, 마켓플레이스와 호환성 확보
   - NFT 전송, 승인 시스템 완벽 구현

3. **좌석 지정 구매**
   - 사용자가 시각적 배치도에서 원하는 좌석 선택 후 구매
   - 각 좌석은 고유한 NFT(tokenId)로 관리

4. **빠른 조회 성능**
   - 여러 매핑을 통한 다중 인덱싱
   - 공연별, 좌석별, 발행자별 빠른 검색 가능

5. **확장성**
   - addTier 함수로 공연 생성 후 등급 추가 가능
   - 여러 발행자 지원
   - 무제한 공연 생성 가능
