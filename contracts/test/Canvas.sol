// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {Canvas} from "../src/Canvas.sol";

contract CanvasTest is Test {
    Canvas public canvas;

    function setUp() public {
        canvas = new Canvas(10, 10);
    }

    function test_drawPixel() public {
        canvas.drawPixel(5, 5, 0xaabbcc);
        assertEq(canvas.getPixel(5, 5), 0xaabbcc);
    }
}
