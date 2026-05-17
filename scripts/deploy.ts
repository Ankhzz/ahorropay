import { ethers } from "hardhat";

const USDM_ADDRESS = process.env.USDM_ADDRESS || "";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const AhorroPay = await ethers.getContractFactory("AhorroPay");
  const contract = await AhorroPay.deploy(USDM_ADDRESS);
  await contract.waitForDeployment();

  console.log("AhorroPay deployed to:", await contract.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});