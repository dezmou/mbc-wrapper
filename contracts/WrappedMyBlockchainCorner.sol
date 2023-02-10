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

    struct Tile {
        address owner;
        string html;
        uint256 price;
    }

    mapping(uint256 => uint256[3]) public tokenIdToCoordinate;
    mapping(uint256 => uint256[4][4]) public coordinateToTokenID;

    struct UnwrappedPendingTile {
        address owner;
        uint256 price;
        uint256 mbc_rake_percent;
    }
    mapping(uint256 => UnwrappedPendingTile[4][4])
        private unwrappedPendingTiles;

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

    function setHtml(
        uint256 page,
        uint32 x,
        uint32 y,
        string calldata html
    ) external {
        require(ownerOf(coordinateToTokenID[page][x][y]) == msg.sender);
        originalMBC.setHtml(page, x, y, html);
    }

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
        uint256[3] memory coords = tokenIdToCoordinate[tokenId];

        return
            string.concat(
                "Page : ",
                Strings.toString(coords[0]),
                " x : ",
                Strings.toString(coords[1]),
                " y : ",
                Strings.toString(coords[2])
            );
    }
}
