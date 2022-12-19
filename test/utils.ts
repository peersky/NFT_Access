/* eslint-disable no-undef */
/* eslint-disable arrow-body-style */
/* eslint-disable no-await-in-loop */
// import { time } from "@openzeppelin/test-helpers";
import hre from "hardhat";
import { contract, ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import {
  MockERC1155,
  MockERC20,
  MockERC721,
} from "../types/typechain/contracts/mocks";
const {
  ZERO_ADDRESS,
  ZERO_BYTES32,
} = require("@openzeppelin/test-helpers/src/constants");
import { BigNumber, BigNumberish, Bytes, BytesLike, Wallet } from "ethers";
// @ts-ignore
import { deploy } from "../scripts/deployContract";
import { assert } from "console";

export interface SignerIdentity {
  name: string;
  id: string;
  wallet: Wallet | SignerWithAddress;
}
export interface AdrSetupResult {
  contractDeployer: SignerWithAddress;
  actor: SignerWithAddress;
  maliciousActor: SignerWithAddress;
}

export interface EnvSetupResult {
  mockERC20: MockERC20;
  mockERC1155: MockERC1155;
  mockERC721: MockERC721;
}

export const setupAddresses = async (): Promise<AdrSetupResult> => {
  const [contractDeployer, actor, maliciousActor] = await ethers.getSigners();
  const createRandomIdentityAndSeedEth = async (name: string) => {
    let newWallet = await ethers.Wallet.createRandom();
    newWallet = newWallet.connect(ethers.provider);
    await contractDeployer.sendTransaction({
      to: newWallet.address,
      value: ethers.utils.parseEther("1"),
    });
    return newWallet;
  };

  //If array of ethers.getSigners() grows above 20 signers, additional addresses can be generated as:
  //   const <name> = await createRandomIdentityAndSeedEth("<name>");

  return {
    contractDeployer,
    actor,
    maliciousActor,
  };
};

export const setupEnvironment = async ({
  contractDeployer,
}: {
  contractDeployer: SignerWithAddress;
}): Promise<EnvSetupResult> => {
  const MockERC20F = await ethers.getContractFactory(
    "MockERC20",
    contractDeployer
  );
  const mockERC20 = (await MockERC20F.deploy(
    "Mock ERC20",
    "MCK20",
    contractDeployer.address
  )) as MockERC20;
  await mockERC20.deployed();

  const MockERC1155F = await ethers.getContractFactory(
    "MockERC1155",
    contractDeployer
  );
  const mockERC1155 = (await MockERC1155F.deploy(
    "MOCKURI",
    contractDeployer.address
  )) as MockERC1155;
  await mockERC1155.deployed();

  const MockERC721F = await ethers.getContractFactory(
    "MockERC721",
    contractDeployer
  );
  const mockERC721 = (await MockERC721F.deploy(
    "Mock ERC721",
    "MCK721",
    contractDeployer.address
  )) as MockERC721;
  await mockERC721.deployed();

  return {
    mockERC1155,
    mockERC20,
    mockERC721,
  };
};

export default {
  setupAddresses,
  setupEnvironment,
  ZERO_ADDRESS,
  ZERO_BYTES32,
};

export async function mineBlocks(count: any) {
  for (let i = 0; i < count; i += 1) {
    await ethers.provider.send("evm_mine", []);
  }
}
