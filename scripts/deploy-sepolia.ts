import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const MockUSDm = await ethers.getContractFactory("MockUSDm");
  const usdm = await MockUSDm.deploy();
  await usdm.waitForDeployment();
  const usdmAddr = await usdm.getAddress();
  console.log("MockUSDm ->", usdmAddr);

  await usdm.mint(deployer.address, ethers.parseUnits("1000000", 18));
  console.log("Minted 1M MockUSDm");

  const AhorroPay = await ethers.getContractFactory("AhorroPay");
  const ap = await AhorroPay.deploy(usdmAddr);
  await ap.waitForDeployment();
  const apAddr = await ap.getAddress();
  console.log("AhorroPay ->", apAddr);

  console.log("--- UPDATE frontend/src/contract.ts ---");
  console.log('SEPOLIA_ADDRESS = "' + apAddr + '"');
  console.log('MockUSDm = "' + usdmAddr + '"');
}

main().catch(console.error);
