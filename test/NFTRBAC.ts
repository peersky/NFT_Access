import { AdrSetupResult, EnvSetupResult, SignerIdentity } from "./utils";
import { setupAddresses, setupEnvironment } from "./utils";
import { expect } from "chai";
import { ethers } from "hardhat";
import { NFTRBAC_Proxy, TargetContract } from "../types/typechain";
const path = require("path");

const scriptName = path.basename(__filename);
let adr: AdrSetupResult;

// interface NFTRBAC_Proxy_wTarget  NFTRBAC_Proxy extends TargetContract;
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
  it.only("Can execute method calls with having a required token id", async () => {
    const fnSig = env.target.interface.getSighash("targetFn1()");

    await env.mockERC1155
      .connect(adr.contractDeployer)
      .mint(adr.actor.address, 1, ethers.BigNumber.from(fnSig), "0x");

    const proxyTarget = (await ethers.getContractAt(
      "TargetContract",
      env.proxy.address
    )) as TargetContract;

    expect(
      await env.mockERC1155.balanceOf(adr.actor.address, 763535957)
    ).to.be.equal("1");

    await expect(proxyTarget.connect(adr.actor).targetFn1()).to.emit(
      env.target,
      "Fn1Accessed(address)"
    );
    await expect(proxyTarget.connect(adr.actor).targetFn2()).to.be.revertedWith(
      "Forbidden by NFTRBAC"
    );
  });
});
