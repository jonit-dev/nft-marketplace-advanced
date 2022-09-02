import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";

import { ethers } from "hardhat";
import { deployContract } from "../helpers/deployHelpers";
import { NFTMarketplace } from "../typechain/NFTMarketplace";

describe("NFTMarketplace.sol", () => {
  let accounts: SignerWithAddress[], deployer: SignerWithAddress, investor: SignerWithAddress;

  let nftMarketplace: NFTMarketplace;

  // deploy contracts
  beforeEach(async () => {
    accounts = await ethers.getSigners();
    deployer = accounts[0];
    investor = accounts[1];

    nftMarketplace = await deployContract("NFTMarketplace", { args: [1] }, false);
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
  });
});
