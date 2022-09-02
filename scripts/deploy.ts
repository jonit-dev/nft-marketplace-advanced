// We require the Hardhat Runtime Environment explicitly here. This is optional

import { Contract } from "ethers";
import fs from "fs";
import hre from "hardhat";

import path from "path";
import { deployContract } from "../helpers/deployHelpers";
import { NFT } from "../typechain";
import { NFTMarketplace } from "../typechain/NFTMarketplace";

interface IABIOutput {
  contract: Contract;
  name: string;
}

async function main() {
  //* 1) Add the deploy contract below
  //* 2) Then, just insert it into the abiOutputs array
  const nftToken = await deployContract<NFT>("NFT", undefined, true);
  const nftMarketplace = await deployContract<NFTMarketplace>("NFTMarketplace", {
    args: [1],
  });
  const abiOutputs: IABIOutput[] = [
    {
      contract: nftToken,
      name: "NFT",
    },
    {
      contract: nftMarketplace,
      name: "NFTMarketplace",
    },
  ];
  generateABI(abiOutputs);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

function generateABI(abiOutputs: IABIOutput[]) {
  for (const output of abiOutputs) {
    const artifactPath = path.resolve(__dirname, `../artifacts/contracts/${output.name}.sol/${output.name}.json`);

    const artifact = fs.readFileSync(artifactPath);

    const artifactData = JSON.parse(artifact.toString());
    const networkName = hre.network.name;
    const chainId = hre.network.config.chainId;
    artifactData.address = output.contract.address;
    artifactData.network = {
      name: networkName,
      chainId: chainId,
    };

    fs.writeFileSync(artifactPath, JSON.stringify(artifactData));

    console.log("Saving Contract data on file: ", artifactPath);
  }
}

export { deployContract };
