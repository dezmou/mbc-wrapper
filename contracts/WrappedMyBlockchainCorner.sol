// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./MyBlockchainCorner.sol";

contract WrappedMyBlockchainCorner {
    MyBlockchainCorner originalMBC = MyBlockchainCorner(0x8C051C68D9601771CE96d4c9e971985aeDE480f7);

    struct Tile {
        address owner;
        string html;
        uint256 price;
    }

    function wrap(uint256 page, uint32 x, uint32 y) public {
        originalMBC.buyTile(page,x,y, "");
    }

    function unWrap(uint256 page, uint32 x, uint32 y, uint256 price) public {
        originalMBC.setPrice(page, x, y, price);
    }

    constructor() {
    }
}
