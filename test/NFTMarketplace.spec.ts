import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";

import { ethers } from "hardhat";
import { deployContract } from "../helpers/deployHelpers";
import { NFTMarketplace } from "../typechain/NFTMarketplace";

describe("NFTMarketplace.sol", () => {
  let accounts: SignerWithAddress[], deployer: SignerWithAddress, investor: SignerWithAddress;

  let nftMarketplace: NFTMarketplace;

  // deploy contracts
  before(async () => {
    accounts = await ethers.getSigners();
    deployer = accounts[0];
    investor = accounts[1];

    nftMarketplace = await deployContract("NFTMarketplace", { args: [1] }, false);
  });

  it("should have an associated marketplace fee", async () => {
    const fee = await nftMarketplace.feePercent();

    expect(fee).to.equal(1);
  });
});
