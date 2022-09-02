import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";

import { ethers } from "hardhat";
import { deployContract } from "../helpers/deployHelpers";
import { NFT } from "../typechain";

describe("NFTMarketplace.sol", () => {
  let accounts: SignerWithAddress[], deployer: SignerWithAddress, investor: SignerWithAddress;

  let nft: NFT;

  // deploy contracts
  beforeEach(async () => {
    accounts = await ethers.getSigners();
    deployer = accounts[0];
    investor = accounts[1];

    nft = await deployContract("NFT", undefined, false);
  });

  describe("Successfully deployed", () => {
    it("should have a name and symbol", async () => {
      const name = await nft.name();
      const symbol = await nft.symbol();

      expect(name).to.equal("NFT");
      expect(symbol).to.equal("NFT");
    });
  });

  describe("Minting", () => {
    it("should successfully mint a token", async () => {
      await nft.connect(deployer).mint("https://www.google.com");
      await nft.connect(investor).mint("https://whatever.com");

      const tokenCount = await nft.tokenCount();

      expect(tokenCount).to.equal(2);

      // expect nft token holder addresses to be on the contract
      const deployerBalance = await nft.balanceOf(deployer.address);
      const investorBalance = await nft.balanceOf(investor.address);

      expect(deployerBalance).to.equal(1);
      expect(investorBalance).to.equal(1);
    });
  });
});
