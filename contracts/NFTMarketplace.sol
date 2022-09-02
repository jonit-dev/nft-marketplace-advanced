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

    // transfers the token to the smart contract
    _nft.transferFrom(msg.sender, address(this), _tokenId);

    listingItems[itemCount] = ListingItem(itemCount, _nft, _tokenId, _price, payable(msg.sender), false);

    emit Listed(itemCount, address(_nft), _tokenId, _price, msg.sender);
  }

  function buyItem(uint256 _itemId) external payable nonReentrant isPurchaseValid(_itemId) {
    uint256 _totalPrice = getTotalListingPrice(_itemId);
    require(msg.value >= _totalPrice, "Insufficient funds");

    // if we reached this point, it means the purchase is valid.

    ListingItem storage _listingItem = listingItems[_itemId];

    // pay the seller
    _listingItem.seller.transfer(_listingItem.price);

    // pay our smart contract fee =D
    feeAccount.transfer(_totalPrice - _listingItem.price);

    _listingItem.sold = true;

    // transfer the token to the buyer
    _listingItem.nft.transferFrom(address(this), msg.sender, _listingItem.tokenId);

    // emit bought event
    emit Bought(
      _itemId,
      address(_listingItem.nft),
      _listingItem.tokenId,
      _listingItem.price,
      _listingItem.seller,
      msg.sender
    );
  }

  function getTotalListingPrice(uint256 _itemId) public view returns (uint256) {
    ListingItem storage item = listingItems[_itemId];

    return (item.price * (100 + feePercent)) / 100;
  }

  modifier isPurchaseValid(uint256 _itemId) {
    ListingItem storage _listingItem = listingItems[_itemId];

    // ensure that the item exists
    require(_itemId > 0 && _itemId <= itemCount, "Item does not exist");

    // and its not already sold!
    require(!_listingItem.sold, "Item already sold");

    _;
  }
}
