import { AdrSetupResult, EnvSetupResult, SignerIdentity } from "./utils";
import { setupAddresses, setupEnvironment } from "./utils";
import { expect } from "chai";
import { ethers } from "hardhat";
import { NFTRBAC_Proxy, TargetContract } from "../types/typechain";
const path = require("path");

const scriptName = path.basename(__filename);
let adr: AdrSetupResult;

interface NFTRBACENV extends EnvSetupResult {
  proxy: NFTRBAC_Proxy & TargetContract;
  target: TargetContract;
}

let env: NFTRBACENV;

describe(scriptName, () => {
  beforeEach(async () => {
    adr = await setupAddresses();
    const envSetup = await setupEnvironment({
      contractDeployer: adr.contractDeployer,
    });

    env = { ...(envSetup as any) };

    const Target = await ethers.getContractFactory(
      "TargetContract",
      adr.contractDeployer
    );
    env.target = (await Target.deploy(
      adr.contractDeployer.address
    )) as TargetContract;
    adr.contractDeployer.address;
    await env.target.deployed();

    const Proxy = await ethers.getContractFactory(
      "NFTRBAC_Proxy",
      adr.contractDeployer
    );
    env.proxy = (await Proxy.deploy(
      env.mockERC1155.address,
      env.target.address
    )) as any;
    await env.proxy.deployed();
    await env.target.transferOwnership(env.proxy.address);
  });
  it("cannot execute method calls without having a required token", async () => {
    const proxyTarget = await ethers.getContractAt(
      "TargetContract",
      env.proxy.address
    );
    await expect(
      proxyTarget.connect(adr.maliciousActor).targetFn1()
    ).to.be.revertedWith("Forbidden by NFTRBAC");
  });
  it("Can execute method calls by HAVING a required token id", async () => {
    const fnSig = env.target.interface.getSighash("targetFn1()");

    await env.mockERC1155
      .connect(adr.contractDeployer)
      .mint(adr.actor.address, 1, ethers.BigNumber.from(fnSig), "0x");

    const proxyTarget = (await ethers.getContractAt(
      "TargetContract",
      env.proxy.address
    )) as TargetContract;

    expect(
      await env.mockERC1155.balanceOf(
        adr.actor.address,
        ethers.BigNumber.from(fnSig)
      )
    ).to.be.equal("1");

    await expect(proxyTarget.connect(adr.actor).targetFn1()).to.emit(
      env.target,
      "Fn1Accessed(address)"
    );
    await expect(proxyTarget.connect(adr.actor).targetFn2()).to.be.revertedWith(
      "Forbidden by NFTRBAC"
    );
  });
  it("Can execute method calls with LOCKING a required token id", async () => {
    const fnSig = env.target.interface.getSighash("targetFn1()");
    const lockTokenId = ethers.BigNumber.from(fnSig).add("1");

    await env.mockERC1155
      .connect(adr.contractDeployer)
      .mint(adr.actor.address, 1, lockTokenId, "0x");

    const proxyTarget = (await ethers.getContractAt(
      "TargetContract",
      env.proxy.address
    )) as TargetContract;

    expect(
      await env.mockERC1155.balanceOf(adr.actor.address, lockTokenId)
    ).to.be.equal("1");

    await env.mockERC1155
      .connect(adr.actor)
      .setApprovalForAll(proxyTarget.address, true);

    await expect(proxyTarget.connect(adr.actor).targetFn1()).to.emit(
      env.target,
      "Fn1Accessed(address)"
    );
    await expect(proxyTarget.connect(adr.actor).targetFn2()).to.be.revertedWith(
      "Forbidden by NFTRBAC"
    );
  });
  it("Can execute method calls by BURNING a required token id", async () => {
    const fnSig = env.target.interface.getSighash("targetFn1()");
    const burnTokenId = ethers.BigNumber.from(fnSig).add("2");

    await env.mockERC1155
      .connect(adr.contractDeployer)
      .mint(adr.actor.address, 1, burnTokenId, "0x");

    const proxyTarget = (await ethers.getContractAt(
      "TargetContract",
      env.proxy.address
    )) as TargetContract;

    expect(
      await env.mockERC1155.balanceOf(adr.actor.address, burnTokenId)
    ).to.be.equal("1");

    await env.mockERC1155
      .connect(adr.actor)
      .setApprovalForAll(proxyTarget.address, true);

    await expect(proxyTarget.connect(adr.actor).targetFn1())
      .to.emit(env.target, "Fn1Accessed(address)")
      .to.emit(env.mockERC1155, "TransferSingle")
      .withArgs(
        proxyTarget.address,
        adr.actor.address,
        ethers.constants.AddressZero,
        burnTokenId,
        "1"
      );
    await expect(proxyTarget.connect(adr.actor).targetFn1()).to.be.revertedWith(
      "Forbidden by NFTRBAC"
    );
    expect(
      await env.mockERC1155.balanceOf(adr.actor.address, burnTokenId)
    ).to.be.equal("0");
  });
  it("Can execute method calls by PAYING a required token id to target contract", async () => {
    const fnSig = env.target.interface.getSighash("targetFn1()");
    const payTokenId = ethers.BigNumber.from(fnSig).add("3");

    await env.mockERC1155
      .connect(adr.contractDeployer)
      .mint(adr.actor.address, 1, payTokenId, "0x");

    const proxyTarget = (await ethers.getContractAt(
      "TargetContract",
      env.proxy.address
    )) as TargetContract;

    expect(
      await env.mockERC1155.balanceOf(adr.actor.address, payTokenId)
    ).to.be.equal("1");

    await env.mockERC1155
      .connect(adr.actor)
      .setApprovalForAll(proxyTarget.address, true);

    await expect(proxyTarget.connect(adr.actor).targetFn1())
      .to.emit(env.target, "Fn1Accessed(address)")
      .to.emit(env.mockERC1155, "TransferSingle")
      .withArgs(
        proxyTarget.address,
        adr.actor.address,
        env.target.address,
        payTokenId,
        "1"
      );
    await expect(proxyTarget.connect(adr.actor).targetFn1()).to.be.revertedWith(
      "Forbidden by NFTRBAC"
    );
    expect(
      await env.mockERC1155.balanceOf(adr.actor.address, payTokenId)
    ).to.be.equal("0");
    expect(
      await env.mockERC1155.balanceOf(env.target.address, payTokenId)
    ).to.be.equal("1");
  });
});
