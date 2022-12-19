import { HardhatRuntimeEnvironment } from "hardhat/types";
export const deploy = async ({
  ContractName,
  constructorArgs,
  hre,
}: {
  ContractName: string;
  constructorArgs?: any;
  hre: HardhatRuntimeEnvironment;
}) => {
  const Contract = await hre.ethers.getContractFactory(ContractName);
  console.log(
    "deploying with args",
    ...constructorArgs.slice(1, constructorArgs.length)
  );

  const contract = await Contract.deploy(
    ...constructorArgs.slice(1, constructorArgs.length)
  );
  await contract.deployed();
  if (require.main === module) {
    console.log(
      "Deploy ",
      ContractName,
      " hash:",
      contract.deployTransaction.hash
    );
  }
  return contract.address;
};

if (require.main === module) {
  //   if (!process.env.PRIVATE_KEY) throw new Error("PK not exported");
  //   if (!process.env.PEERSKY_FRIENDS_OWNER)
  //     throw new Error("PEERSKY_FRIENDS_OWNER not exported");
  //   if (!process.env.PEERSKY_FRIENDS_IPFS)
  //     throw new Error("PEERSKY_FRIENDS_IPFS not exported");
  //   deploy({
  //     owner: process.env.PEERSKY_FRIENDS_OWNER,
  //     uri: process.env.PEERSKY_FRIENDS_IPFS,
  //   })
  //     .then((resp) => {
  //       console.log("Peersky friends token deployed:", resp);
  //       process.exit(0);
  //     })
  //     .catch((error) => {
  //       console.error(error);
  //       process.exit(1);
  //     });
}

exports.deploy = deploy;
export default { deploy };
