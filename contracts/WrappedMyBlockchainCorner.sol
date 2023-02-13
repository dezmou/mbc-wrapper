// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./MyBlockchainCorner.sol";

contract WrappedMyBlockchainCorner is
    ERC721,
    ERC721Burnable,
    Ownable,
    ReentrancyGuard
{
    MyBlockchainCorner originalMBC =
        MyBlockchainCorner(0x8C051C68D9601771CE96d4c9e971985aeDE480f7);

    mapping(uint256 => uint256[3]) public tokenIdToCoordinate;
    mapping(uint256 => uint256[4][4]) public coordinateToTokenID;

    struct UnwrappedPendingTile {
        address owner;
        uint256 price;
        uint256 mbc_rake_percent;
    }
    mapping(uint256 => UnwrappedPendingTile[4][4])
        private unwrappedPendingTiles;

    receive() external payable {}

    fallback() external payable {}

    /**
     * ERC721 tokenID must be an uint256 but MBC tile identifier is using 3 integers.
     * So we concatenate those 3 integers and get the keccak256 as the tokenID;
     */
    function getTokenId(
        uint256 page,
        uint256 x,
        uint256 y
    ) public pure returns (uint256) {
        string memory str = string.concat(
            Strings.toString(page),
            "_",
            Strings.toString(x),
            "_",
            Strings.toString(y)
        );
        return uint(keccak256(bytes(str)));
    }

    /**
     * Wrap function
     * Wrap a tile already for sale on the original contract
     * Then buy it with this function to get the wrapped tile
     */
    function wrap(
        uint256 page,
        uint32 x,
        uint32 y,
        string calldata html
    ) public payable {
        originalMBC.buyTile{value: msg.value}(page, x, y, html);
        uint256 tokenId = getTokenId(page, x, y);
        tokenIdToCoordinate[tokenId] = [page, x, y];
        coordinateToTokenID[page][x][y] = tokenId;

        // If tile was previously unwrapped without claiming eths we activate claim eth
        if (unwrappedPendingTiles[page][x][y].owner != address(0)) {
            address previousOwner = unwrappedPendingTiles[page][x][y].owner;
            uint256 price = unwrappedPendingTiles[page][x][y].price;
            uint256 percent = unwrappedPendingTiles[page][x][y]
                .mbc_rake_percent;
            delete unwrappedPendingTiles[page][x][y];

            // we does not check if ethers were sent to avoid denial of service attack
            previousOwner.call{value: (price * percent) / 100}("");
        }
        _safeMint(msg.sender, tokenId);
    }

    /**
     * Set the HTML of the tile, it will affect the original contract
     */
    function setHtml(
        uint256 page,
        uint32 x,
        uint32 y,
        string calldata html
    ) external {
        require(ownerOf(coordinateToTokenID[page][x][y]) == msg.sender);
        originalMBC.setHtml(page, x, y, html);
    }

    /**
     * Unwrap your tile, this will set the tile for sale on the original contract
     * Then you or someone else can buy it on the original contract
     */
    function unWrap(uint256 page, uint32 x, uint32 y, uint256 price) public {
        require(ownerOf(coordinateToTokenID[page][x][y]) == msg.sender);
        originalMBC.setPrice(page, x, y, price);

        UnwrappedPendingTile memory target;
        target.owner = msg.sender;
        target.price = price;
        target.mbc_rake_percent = originalMBC.percent();
        unwrappedPendingTiles[page][x][y] = target;

        uint256 tokenId = coordinateToTokenID[page][x][y];
        super._burn(tokenId);
    }

    /**
     * Once you unwraped your tile and bought it back on the original contract
     * Claim the ETH you used to buy it back
     */
    function claimEthFromUnwrappedTile(
        uint256 page,
        uint32 x,
        uint32 y
    ) public {
        (address tileOwner, , ) = originalMBC.pages(page, x, y);
        require(tileOwner != address(this));

        require(unwrappedPendingTiles[page][x][y].owner == msg.sender);
        uint256 price = unwrappedPendingTiles[page][x][y].price;
        uint256 percent = unwrappedPendingTiles[page][x][y].mbc_rake_percent;
        delete unwrappedPendingTiles[page][x][y];

        (bool sent, ) = msg.sender.call{value: (price * percent) / 100}("");
        require(sent);
    }

    constructor() ERC721("Wrapped MyBlockchainCorner", "MBC") {}

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721) returns (string memory) {
        ownerOf(tokenId);
        uint256[3] memory coords = tokenIdToCoordinate[tokenId];

        string
            memory image = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" id="chien" width="1000" height="1000"><style>.tile {fill : #b27f33;stroke : black;shadow: 1px 1px 5px 2px #000000;opacity : 0.35;}.curTile {opacity : 1;}text {font-family: verdana;font-weight : bold;}.title { font-size: 40px;fill : #432800;}.wr {font-size: 34px;fill : #432800;}.pa {font-size: 70px;fill : #670d59;}</style><text class="title" x="10" y="45" >MY BLOCKCHAIN CORNER</text><text class="wr" x="10" y="85" >WRAPPED TILE</text><text class="pa" x="8" y="170" >PAGE ';

        image = string(abi.encodePacked(image, Strings.toString(coords[0])));
        image = string(
            abi.encodePacked(
                image,
                ' </text><g transform="translate(0,200),scale(0.98)" transform-origin="center">'
            )
        );

        uint[] memory xCoords = new uint[](4);
        xCoords[0] = 0;
        xCoords[1] = 253;
        xCoords[2] = 506;
        xCoords[3] = 759;

        uint[] memory yCoords = new uint[](4);
        yCoords[0] = 0;
        yCoords[1] = 183;
        yCoords[2] = 366;
        yCoords[3] = 549;

        for (uint256 x = 0; x < 4; x++) {
            for (uint256 y = 0; y < 4; y++) {
                image = string(
                    abi.encodePacked(image, '<rect rx="10" class="tile ')
                );

                if (coords[1] == y && coords[2] == x) {
                    image = string(
                        abi.encodePacked(
                            image,
                            'curTile'
                        )
                    );
                }

                image = string(
                    abi.encodePacked(image, '" width="240" height="170" x="')
                );

                image = string(
                    abi.encodePacked(image, Strings.toString(xCoords[x]))
                );

                image = string(abi.encodePacked(image, '" y="'));

                image = string(
                    abi.encodePacked(image, Strings.toString(yCoords[y]))
                );

                image = string(abi.encodePacked(image, '"></rect>'));
            }
        }

        image = string(abi.encodePacked(image, "</g></svg>"));

        string memory json = Base64.encode(bytes(string(abi.encodePacked('{"name": "MyBlockchainCorner Tile", "description": "MyBlockchainCorner display html tiles that are stored in the ethereum blockchain, which means that if you purchase one of them, it will live forever.", "attributes" : [{"display_type": "number", "trait_type": "Page", "value" : ',Strings.toString(coords[0]),'},{"display_type": "number", "trait_type": "Row", "value" : ',Strings.toString(coords[2]),'},{"display_type": "number", "trait_type": "Column", "value" : ',Strings.toString(coords[1]),'}], "image": "data:image/svg+xml;base64,', Base64.encode(bytes(image)), '"}'))));
        return string(abi.encodePacked('data:application/json;base64,', json));
    }
}

/// [MIT License]
/// @title Base64
/// @notice Provides a function for encoding some bytes in base64
/// @author Brecht Devos <brecht@loopring.org>
library Base64 {
    bytes internal constant TABLE =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    /// @notice Encodes some bytes to the base64 representation
    function encode(bytes memory data) internal pure returns (string memory) {
        uint256 len = data.length;
        if (len == 0) return "";

        // multiply by 4/3 rounded up
        uint256 encodedLen = 4 * ((len + 2) / 3);

        // Add some extra buffer at the end
        bytes memory result = new bytes(encodedLen + 32);

        bytes memory table = TABLE;

        assembly {
            let tablePtr := add(table, 1)
            let resultPtr := add(result, 32)

            for {
                let i := 0
            } lt(i, len) {

            } {
                i := add(i, 3)
                let input := and(mload(add(data, i)), 0xffffff)

                let out := mload(add(tablePtr, and(shr(18, input), 0x3F)))
                out := shl(8, out)
                out := add(
                    out,
                    and(mload(add(tablePtr, and(shr(12, input), 0x3F))), 0xFF)
                )
                out := shl(8, out)
                out := add(
                    out,
                    and(mload(add(tablePtr, and(shr(6, input), 0x3F))), 0xFF)
                )
                out := shl(8, out)
                out := add(
                    out,
                    and(mload(add(tablePtr, and(input, 0x3F))), 0xFF)
                )
                out := shl(224, out)

                mstore(resultPtr, out)

                resultPtr := add(resultPtr, 4)
            }

            switch mod(len, 3)
            case 1 {
                mstore(sub(resultPtr, 2), shl(240, 0x3d3d))
            }
            case 2 {
                mstore(sub(resultPtr, 1), shl(248, 0x3d))
            }

            mstore(result, encodedLen)
        }

        return string(result);
    }
}
