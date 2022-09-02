//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "./NFTTypes.sol";

contract NFTMarketplace is NFTTypes, ReentrancyGuard {
  // fees
  address payable public immutable feeAccount;
  uint256 public immutable feePercent;

  // other
  uint256 public itemCount;

  // marketplace items (listings)

  mapping(uint256 => ListingItem) public listingItems;

  constructor(uint256 _feePercent) {
    feeAccount = payable(msg.sender);
    feePercent = _feePercent;
  }

  function listItem(
    IERC721 _nft,
    uint256 _tokenId,
    uint256 _price
  ) external nonReentrant {
    require(_price > 0, "Price must be greater than zero");

    itemCount++;

    _nft.transferFrom(msg.sender, address(this), _tokenId); // transfers the token to the smart contract

    // add it to our listingItems mapping
    listingItems[itemCount] = ListingItem(itemCount, _nft, _tokenId, _price, payable(msg.sender), false);
  }
}
