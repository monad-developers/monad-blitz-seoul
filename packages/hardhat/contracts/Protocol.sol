pragma solidity ^0.8.0;

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./interface/IProtocol.sol";

struct User {
    string name;
    address addr;
    string location;
    int256 pos;
}

struct Store {
    address addr;
    string location;
    int256 pos;
    string name;
    string description;
}

struct Menu {
    uint256 index;
    address store_address;
    string name;
    string description;
    int256 price;
    string image_url;
}

struct Order {
    uint256 index;
    uint256[] menu;
    int256 total_price;
    uint256 request_index;
    int256 delivery_fee;
}

struct Deliver {
    string name;
    address addr;
}

struct Delivery_Request {
    uint256 index;
    address user_addr;
    address store_addr;
    address deliver_addr;
    uint256 order_index;
}

contract Protocol is IProtocol, Initializable, OwnableUpgradeable {
    // 지불 토큰 주소
    uint256 public wti_price;

    Store[] public stores;
    mapping(address => User) public userMap;
    mapping(address => Store) public storeMap;
    mapping(address => Deliver) public deliverMap;
    // store address로 menu index의 list매핑
    mapping(address => Menu[]) public storeMenuMap;

    // 요청한 유저의 주소 -> delivery_request index[]
    mapping(address => uint256[]) public userOrderMap;
    // order index -> order
    Order[] public orders;
    mapping(address => Order[]) public orderMap;
    // delivery_requset index
    Delivery_Request[] public deliveryRequests;
    // mapping(uint256 => Delivery_Request) public deliveryRequestMap;
    // delivery request index
    uint256[] public pending_delivery;

    function initialize() public initializer {
        __Ownable_init(msg.sender);

        // --- 목(Mock) 데이터 초기화 ---
        initializeMockData();

        wti_price = 1;

    }

    function initializeMockData() public onlyOwner {
        // 1. 유저 데이터 등록
        userMap[0xc638cfF5173bE947494207FE67B76460EBeaA23f] = User({
            name: unicode"김철수",
            addr: 0xc638cfF5173bE947494207FE67B76460EBeaA23f,
            location: unicode"서울시 강남구 역삼동",
            pos: 1
        });

        // 2. 상점 데이터 등록
        storeMap[0xc638cfF5173bE947494207FE67B76460EBeaA23f] = Store({
            addr: 0xc638cfF5173bE947494207FE67B76460EBeaA23f,
            location: unicode"서울시 강남구 테헤란로",
            pos: 2,
            name: unicode"황금반점",
            description: unicode"전통 중화요리 전문점, 30년 내공의 맛"
        });
        storeMap[0x9206a132Ae7Ffa929f50EF8551c21B387f5234C7] = Store({
            addr: 0x9206a132Ae7Ffa929f50EF8551c21B387f5234C7,
            location: unicode"서울시 서초구 반포동",
            pos: 3,
            name: unicode"맛나분식",
            description: unicode"추억의 맛, 떡볶이와 김밥"
        });

        // 3. 배달원 데이터 등록
        deliverMap[0x1FfF36fABa6Bd6507a08d3296ef60e4fd6b15095] = Deliver({
            addr: 0x1FfF36fABa6Bd6507a08d3296ef60e4fd6b15095,
            name: unicode"스피드맨"
        });

        // 4. 메뉴 데이터 등록 (storeMenuMap에 push)
        storeMenuMap[0xc638cfF5173bE947494207FE67B76460EBeaA23f].push(Menu({
            index: 0,
            store_address: 0xc638cfF5173bE947494207FE67B76460EBeaA23f,
            name: unicode"짜장면",
            description: unicode"기본에 충실한 짜장면",
            price: 7000,
            image_url: "https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyNTA0MjlfMTM1%2FMDAxNzQ1OTAwMTQ0Njk2.YtBTUQUwQVnUBLEomgr-PggTodTsna6ThCbVKRWhG4gg.tt8bP14sKO91Ui99Y0GBU9NzFGFDcSJrLp_LtL9EyY0g.PNG%2FChatGPT_Image_2025%25B3%25E2_4%25BF%25F9_29%25C0%25CF_%25BF%25C0%25C8%25C4_01_14_08.png&type=sc960_832"
        }));
        storeMenuMap[0xc638cfF5173bE947494207FE67B76460EBeaA23f].push(Menu({
            index: 1,
            store_address: 0xc638cfF5173bE947494207FE67B76460EBeaA23f,
            name: unicode"짬뽕",
            description: unicode"얼큰하고 시원한 짬뽕",
            price: 9000,
            image_url: "https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyNDEyMTZfMTcx%2FMDAxNzM0MzA2NjYwODYw.hQ2hOniGyiUfXq_JyZTkU6kuqC0qp0SBafvJtWd1sK0g.Nv3QClhLyI0xeh-iw4gGKrj6-M0tu64E5hxDquUCyPIg.JPEG%2FIMG_5899.jpg&type=sc960_832"
        }));
        storeMenuMap[0x9206a132Ae7Ffa929f50EF8551c21B387f5234C7].push(Menu({
            index: 0,
            store_address: 0x9206a132Ae7Ffa929f50EF8551c21B387f5234C7,
            name: unicode"떡볶이",
            description: unicode"매콤달콤한 국민 간식",
            price: 5000,
            image_url: "https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyNTA1MDFfNDcg%2FMDAxNzQ2MDQ3ODg5ODY1.BbklCP5HUAZwfdoLMC5vncldEe3nXtkMKXy0_UPuIQ4g.6f7xOtSDBBKSf--CMP9LBYVOKD7VD9-TYFbVzJv530og.PNG%2Fcb914beb-a20b-49c6-beee-6bbedea5dde1.png&type=sc960_832"
        }));
        storeMenuMap[0x9206a132Ae7Ffa929f50EF8551c21B387f5234C7].push(Menu({
            index: 1,
            store_address: 0x9206a132Ae7Ffa929f50EF8551c21B387f5234C7,
            name: unicode"김밥",
            description: unicode"속이 꽉 찬 맛있는 김밥",
            price: 3000,
            image_url: "https://search.pstatic.net/common/?src=http%3A%2F%2Fblogfiles.naver.net%2FMjAyNDEyMjFfMjE1%2FMDAxNzM0NzgwNzE1OTM4.usw9AVVnHxzFSVsRIf8cunnnrcrPlp4h7Kb_2Q2yKdsg.5ug6RW5y_p5xdHKahorGms0OTAceY0Kghoob9qszjNMg.JPEG%2F%25B1%25E8%25B9%25E4_024.jpg&type=sc960_832"
        }));
        storeMenuMap[0x9206a132Ae7Ffa929f50EF8551c21B387f5234C7].push(Menu({
            index: 2,
            store_address: 0x9206a132Ae7Ffa929f50EF8551c21B387f5234C7,
            name: unicode"순대",
            description: unicode"쫄깃하고 고소한 순대",
            price: 4000,
            image_url: "https://search.pstatic.net/common/?src=http%3A%2F%2Fshopping.phinf.naver.net%2Fmain_5330441%2F53304411993.3.20250306104652.jpg&type=sc960_832"
        }));
    }

    function registerUser(string calldata name, string calldata location, int256 pos) external override {
        require(bytes(userMap[msg.sender].name).length == 0, "User already registered");
        
        userMap[msg.sender] = User({
            name: name,
            addr: msg.sender,
            location: location,
            pos: pos
        });
    }

    function getStores() public view returns(Store[] memory) {
        return stores;
    }

    function registerStore(string calldata name, string calldata description, string calldata location, int256 pos) external override {
        require(bytes(storeMap[msg.sender].name).length == 0, "Store already registered");

        storeMap[msg.sender] = Store({
            name: name,
            description: description,
            addr: msg.sender,
            location: location,
            pos: pos
        });

        stores.push(storeMap[msg.sender]);
    }
    function registerDeliver(string calldata name) external override {
        require(bytes(deliverMap[msg.sender].name).length == 0, "Deliver already registered");

        deliverMap[msg.sender] = Deliver({
            addr: msg.sender,
            name: name
        });
    }

    function addMenu(string calldata name, string calldata description, int256 price, string calldata image_url) external override {
        require(bytes(storeMap[msg.sender].name).length != 0, "Not found stores");

        storeMenuMap[msg.sender].push(Menu({
            index: storeMenuMap[msg.sender].length,
            name: name,
            store_address: msg.sender,
            description: description,
            price: price,
            image_url: image_url
        }));
    }

    function getStoreMenu(address store_address) public view returns(Menu[] memory) {
        return storeMenuMap[store_address];
    }

    function removeMenu(uint256 menu_index) external override {
        revert("Unimplemented");
    }
    function removeUser(address user_addr) external override {
        revert("Unimplemented");
    }
    function removeStore(address user_addr) external override {
        revert("Unimplemented");
    }
    function removeDelivery(address user_addr) external override {
        revert("Unimplemented");
    }
    
    function order(address store_address, uint256[] memory menu_index) external payable override {
        require(bytes(userMap[msg.sender].name).length != 0, "Not found user");
        require(bytes(storeMap[store_address].name).length != 0, "Not found store");

        uint256 order_ind = orders.length;

        Delivery_Request memory delivery_request = Delivery_Request({
            index: deliveryRequests.length,
            order_index: orders.length,
            user_addr: msg.sender,
            store_addr: store_address,
            deliver_addr: address(0)
        });

        int256 total_price = 0;
        for (uint256 index = 0; index <= menu_index.length; index++){
            if (storeMenuMap[store_address].length > 0 && bytes(storeMenuMap[store_address][index].name).length != 0){
                Menu memory menu = storeMenuMap[store_address][index];
                total_price += menu.price;
            }
        }

        // delivery fee
        int256 distance = (storeMap[store_address].pos - userMap[msg.sender].pos);
        int256 delivery_fee = distance * 1;

        orders.push(Order({
            index: orders.length,
            menu: menu_index,
            total_price: total_price,
            delivery_fee: delivery_fee,
            request_index: delivery_request.index
        }));

        orderMap[msg.sender].push(orders[order_ind]);

        emit OrderMenu(order_ind, store_address, msg.sender, distance, total_price, delivery_fee);
    }

    function GetOrders() external returns(Order[] memory){
        return  orderMap[msg.sender];
    }

    function approveDelivery(uint256 delivery_request_index) external override {
        deliveryRequests[delivery_request_index].deliver_addr = msg.sender;

        emit ConfirmDelivery(delivery_request_index, deliveryRequests[delivery_request_index].index);
    }

    function confirmOrder(uint256 order_index) external payable override {
        // orders[order_index].request_index
        // payable().transfer()
    }
}