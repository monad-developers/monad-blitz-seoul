// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract Canvas {
    uint16 public immutable width;
    uint16 public immutable height;

    mapping(uint32 index => uint24) public pixels;

    event PixelDrawn(address indexed user, uint16 x, uint16 y, uint24 color);

    constructor(uint16 _width, uint16 _height) {
        require(_width > 0 && _height > 0, "Invalid canvas size");
        width = _width;
        height = _height;
    }

    function drawPixel(uint16 x, uint16 y, uint24 color) public {
        pixels[_index(x, y)] = color;
        emit PixelDrawn(msg.sender, x, y, color);
    }

    function getPixel(uint16 x, uint16 y) public view returns (uint24) {
        return pixels[_index(x, y)];
    }

    function getAllPixels() public view returns (uint24[] memory) {
        uint32 total = uint32(width) * height;
        uint24[] memory allPixels = new uint24[](total);

        for (uint32 i = 0; i < total; i++) {
            allPixels[i] = pixels[i];
        }

        return allPixels;
    }

    function _index(uint16 x, uint16 y) internal view returns (uint32) {
        require(x < width && y < height, "Invalid coordinates");
        return uint32(y) * width + x;
    }
}
