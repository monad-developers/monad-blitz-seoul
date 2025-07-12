// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IProtocol {
    // user, 가게, deliver 등록
    function registerUser(string calldata name, string calldata location, int256 pos) external;
    function registerStore(string calldata name, string calldata description, string calldata location, int256 pos) external;
    function registerDeliver(string calldata name) external;

    // 메뉴 등록
    function addMenu(string calldata name, string calldata description, int256 price, string calldata image_url) external ;

    // user, store, deliver, menu 제거
    function removeMenu(uint256 menu_index) external;
    function removeUser(address user_addr) external;
    function removeStore(address user_addr) external;
    function removeDelivery(address user_addr) external;

    function order(address store_address,uint256[] memory menu_index) external payable;
    function approveDelivery(uint256 delivery_request_index) external;

    function confirmOrder(uint256 order_index) external payable;


    // event
    event OrderMenu(uint256 order_index, address store_address, address user_address, int256 distance, int256 total_price, int256 delivery_fee);
    event ConfirmDelivery(uint256 delivery_request_index, uint256 order_index);
    event ConfirmOrder(
      address user_addr,
      address store_addr,
      address deliver_addr
    );
}