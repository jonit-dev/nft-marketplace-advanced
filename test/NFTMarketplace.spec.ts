import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";

import { ethers } from "hardhat";
import { deployContract } from "../helpers/deployHelpers";
import { NFT } from "../typechain";
import { NFTMarketplace } from "../typechain/NFTMarketplace";

import { ToToken } from "../helpers/utilsHelper";

describe("NFTMarketplace.sol", () => {
  let accounts: SignerWithAddress[],
    deployer: SignerWithAddress,
    investor: SignerWithAddress,
    seller: SignerWithAddress;

  let nftMarketplace: NFTMarketplace;
  let nft: NFT;

  // deploy contracts
  beforeEach(async () => {
    accounts = await ethers.getSigners();
    deployer = accounts[0];
    investor = accounts[1];
    seller = accounts[2];

    nftMarketplace = await deployContract("NFTMarketplace", { args: [1] }, false);
    nft = await deployContract("NFT", undefined, false);
  });

  describe("Fees", () => {
    it("should have a fee account", async () => {
      const feeAccount = await nftMarketplace.feeAccount();
      expect(feeAccount).to.equal(deployer.address);
    });

    it("should have an associated marketplace fee", async () => {
      const fee = await nftMarketplace.feePercent();

      expect(fee).to.equal(1);
    });

    it("should properly get the getTotalListingPrice", async () => {
      // mint new NFT to be listed
      await nft.connect(seller).mint("https://nft.com");

      // deployer approves marketplace contract to spend NFT (so nft.transferFrom can be called form the marketplace contract)
      await nft.connect(seller).setApprovalForAll(nftMarketplace.address, true);

      await nftMarketplace.connect(seller).listItem(nft.address, 1, ToToken("1"));

      const totalListingPrice = await nftMarketplace.getTotalListingPrice(1);

      expect(totalListingPrice).to.equal(ToToken("1.01"));
    });
  });

  describe("Listing a new item", () => {
    beforeEach(async () => {
      await mintAndApproveNFT(nftMarketplace, nft, seller);
    });

    it("should successfully list an item, transfer NFT form seller to marketplace and emit Listed event", async () => {
      const listItem = nftMarketplace.connect(seller).listItem(nft.address, 1, ToToken("1"));

      await expect(listItem)
        .to.emit(nftMarketplace, "Listed")
        .withArgs(1, nft.address, 1, ToToken("1"), seller.address);

      // check if marketplace now is the actual owner of this NFT.
      expect(await nft.ownerOf(1)).to.equal(nftMarketplace.address);
    });

    it("should fail if an user tries to list an NFT with price set to zero", async () => {
      const listItem = nftMarketplace.connect(seller).listItem(nft.address, 1, ToToken("0"));

      await expect(listItem).to.be.revertedWith("Price must be greater than 0");
    });

    it("should fail if the seller tries to list an NFT with token id of 0", async () => {
      const listItem = nftMarketplace.connect(seller).listItem(nft.address, 0, ToToken("1"));

      await expect(listItem).to.be.revertedWith("Token ID must be greater than 0");
    });

    it("should fail if we try to list a token with invalid address", async () => {
      const listItem = nftMarketplace
        .connect(seller)
        .listItem("0x0000000000000000000000000000000000000000", 1, ToToken("1"));

      await expect(listItem).to.be.revertedWith("NFT address must be valid");
    });

    it("should fail if you try to list a token that you don't own", async () => {
      // remember that tokenId 1 is listed by the seller, already!
      const listItem = nftMarketplace.connect(investor).listItem(nft.address, 1, ToToken("1"));

      await expect(listItem).to.be.revertedWith("You must own the token to list it");
    });
  });

  describe("Purchase", () => {
    beforeEach(async () => {
      await mintAndApproveNFT(nftMarketplace, nft, seller, true);
    });

    describe("Purchase validation", async () => {
      it("should fail if the user tries to purchase an NFT that doesn't exist", async () => {
        const purchase = nftMarketplace.connect(investor).buyItem(999);
        await expect(purchase).to.be.revertedWith("Item does not exist");
      });

      it("should fail if you try to pay MORE or LESS money than the total price", async () => {
        const purchase = nftMarketplace.connect(investor).buyItem(1, {
          value: ToToken("2"),
        });

        await expect(purchase).to.be.revertedWith(
          "You're trying to pay a price that's different from the listing price"
        );

        const purchase2 = nftMarketplace.connect(investor).buyItem(1, {
          value: 0,
        });

        await expect(purchase2).to.be.revertedWith(
          "You're trying to pay a price that's different from the listing price"
        );
      });

      it("should fail if you try to buy your own NFT", async () => {
        const sellerPurchase = nftMarketplace.connect(seller).buyItem(1, {
          value: ToToken("1.01"),
        });

        await expect(sellerPurchase).to.be.revertedWith("You cannot buy your own NFT!");
      });

      it("should fail if the NFT is already sold", async () => {
        await nftMarketplace.connect(investor).buyItem(1, {
          value: ToToken("1.01"),
        });

        const purchase = nftMarketplace.connect(investor).buyItem(1, {
          value: ToToken("1.01"),
        });

        await expect(purchase).to.be.revertedWith("Item is already sold");
      });

      // it("should fail if an investor tries to buy an NFT but has insufficient funds", async () => {
      //   const insufficientMoneyPurchase = nftMarketplace.connect(investor).buyItem(1, {
      //     value: ToToken("1"), // NFT price is 1 + 1% fee
      //   });

      //   await expect(insufficientMoneyPurchase).to.be.revertedWith("Insufficient funds");
      // });
    });

    describe("Purchase success", async () => {
      it("should update item as sold, pay the seller, transfer the NFT to the buyer, charge fees and emit a Bought event", async () => {
        const sellerInitialBalance = await seller.getBalance();
        const buyerInitialBalance = await investor.getBalance();
        const feeAccountInitialBalance = await deployer.getBalance();

        const purchase = nftMarketplace.connect(investor).buyItem(1, {
          value: ToToken("1.01"), // NFT price is 1 ETH + fee!
        });

        // Bought event is emitted
        await expect(purchase)
          .to.emit(nftMarketplace, "Bought")
          .withArgs(1, nft.address, 1, ToToken("1"), seller.address, investor.address);

        const item = await nftMarketplace.listingItems(1);

        // check if item is sold
        expect(item.sold).to.equal(true);

        const sellerFinalBalance = await seller.getBalance();
        const buyerFinalBalance = await investor.getBalance();
        const feeAccountFinalBalance = await deployer.getBalance();

        // check if seller received the correct amount of ETH
        expect(sellerFinalBalance.sub(sellerInitialBalance)).to.equal(ToToken("1"));

        // check if marketplace received its fee
        expect(feeAccountFinalBalance.sub(feeAccountInitialBalance)).to.equal(ToToken("0.01"));

        // check if buyer received its NFT
        expect(await nft.ownerOf(1)).to.equal(investor.address);

        expect(buyerFinalBalance < buyerInitialBalance).to.equal(true);
      });
    });
  });
});

const mintAndApproveNFT = async (
  nftMarketplace: NFTMarketplace,
  nft: NFT,
  seller: SignerWithAddress,
  listMinted: boolean = false
) => {
  // mint new NFT to be listed
  await nft.connect(seller).mint("https://nft.com");

  // deployer approves marketplace contract to spend NFT (so nft.transferFrom can be called form the marketplace contract)
  await nft.connect(seller).setApprovalForAll(nftMarketplace.address, true);

  if (listMinted) {
    nftMarketplace.connect(seller).listItem(nft.address, 1, ToToken("1"));
  }
};
