// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

abstract contract MyBlockchainCorner {
    struct Tile {
        address owner;
        string html;
        uint256 price;
    }
    address private owner;
    uint256 public cost;
    uint256 public percent;
    mapping(uint256 => Tile[4][4]) public pages;

    function setPrice(
        uint256 page,
        uint32 x,
        uint32 y,
        uint256 price
    ) external virtual;

    function setHtml(
        uint256 page,
        uint32 x,
        uint32 y,
        string calldata html
    ) external virtual;

    function buyTile(
        uint256 page,
        uint32 x,
        uint32 y,
        string calldata html
    ) public payable virtual;
}
