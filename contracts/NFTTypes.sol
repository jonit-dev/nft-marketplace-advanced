//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract NFTTypes {
  struct ListingItem {
    uint256 itemId;
    IERC721 nft;
    uint256 tokenId;
    uint256 price;
    address payable seller;
    bool sold;
  }

  event Listed(uint256 itemId, address indexed nft, uint256 tokenId, uint256 price, address indexed seller);

  event Bought(
    uint256 itemId,
    address indexed nft,
    uint256 tokenId,
    uint256 price,
    address indexed seller,
    address indexed buyer
  );
}
