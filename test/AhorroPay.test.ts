import { expect } from "chai";
import { ethers } from "hardhat";

describe("AhorroPay", function () {
  let ahorroPay: any;
  let usdm: any;
  let owner: any, member1: any, member2: any;

  const AMOUNT = ethers.parseUnits("10", 18);
  const DURATION = 3600n;
  const MAX_MEMBERS = 3n;

  beforeEach(async function () {
    [owner, member1, member2] = await ethers.getSigners();

    const MockUSDm = await ethers.getContractFactory("MockUSDm");
    usdm = await MockUSDm.deploy();
    await usdm.waitForDeployment();

    const AhorroPay = await ethers.getContractFactory("AhorroPay");
    ahorroPay = await AhorroPay.deploy(await usdm.getAddress());
    await ahorroPay.waitForDeployment();

    for (const signer of [owner, member1, member2]) {
      await usdm.mint(signer.address, ethers.parseUnits("1000", 18));
      await usdm.connect(signer).approve(await ahorroPay.getAddress(), ethers.parseUnits("1000", 18));
    }
  });

  it("should create a circle", async function () {
    await ahorroPay.createCircle(AMOUNT, DURATION, MAX_MEMBERS);
    const [creator, amount] = await ahorroPay.circles(0);
    expect(creator).to.equal(owner.address);
    expect(amount).to.equal(AMOUNT);
  });

  it("should let members join and auto-start when full", async function () {
    await ahorroPay.createCircle(AMOUNT, DURATION, MAX_MEMBERS);
    await ahorroPay.connect(member1).joinCircle(0);
    await ahorroPay.connect(member2).joinCircle(0);
    const [, , , , , , , , state] = await ahorroPay.circles(0);
    expect(state).to.equal(1);
  });

  it("should process contributions and payout", async function () {
    await ahorroPay.createCircle(AMOUNT, DURATION, MAX_MEMBERS);
    await ahorroPay.connect(member1).joinCircle(0);
    await ahorroPay.connect(member2).joinCircle(0);

    await ahorroPay.connect(owner).contribute(0);
    await ahorroPay.connect(member1).contribute(0);
    await ahorroPay.connect(member2).contribute(0);

    const bal = await usdm.balanceOf(owner.address);
    const expected = ethers.parseUnits("1000", 18) - AMOUNT + AMOUNT * 3n;
    expect(bal).to.equal(expected);

    const [, , , , , round] = await ahorroPay.circles(0);
    expect(round).to.equal(1);
  });

  it("should reject double contribution", async function () {
    await ahorroPay.createCircle(AMOUNT, DURATION, MAX_MEMBERS);
    await ahorroPay.connect(member1).joinCircle(0);
    await ahorroPay.connect(member2).joinCircle(0);

    await ahorroPay.connect(owner).contribute(0);
    await expect(ahorroPay.connect(owner).contribute(0)).to.be.revertedWithCustomError(
      ahorroPay,
      "AlreadyContributed"
    );
  });

  it("should allow claimPayout by receiver", async function () {
    await ahorroPay.createCircle(AMOUNT, DURATION, MAX_MEMBERS);
    await ahorroPay.connect(member1).joinCircle(0);
    await ahorroPay.connect(member2).joinCircle(0);

    // All 3 contribute — payout auto-sends to receiver
    await ahorroPay.connect(owner).contribute(0);
    await ahorroPay.connect(member1).contribute(0);
    await ahorroPay.connect(member2).contribute(0);

    const bal = await usdm.balanceOf(owner.address);
    const expected = ethers.parseUnits("1000", 18) - AMOUNT + AMOUNT * 3n;
    expect(bal).to.equal(expected);

    // Non-receiver cannot claim on next round
    await expect(ahorroPay.connect(member2).claimPayout(0)).to.be.revertedWithCustomError(
      ahorroPay,
      "NotReceiverTurn"
    );
  });

  it("should revert dispute before deadline", async function () {
    await ahorroPay.createCircle(AMOUNT, DURATION, MAX_MEMBERS);
    await ahorroPay.connect(member1).joinCircle(0);
    await ahorroPay.connect(member2).joinCircle(0);

    await expect(ahorroPay.dispute(0)).to.be.revertedWithCustomError(
      ahorroPay,
      "TooEarlyForDispute"
    );
  });

  it("should complete all rounds", async function () {
    await ahorroPay.createCircle(AMOUNT, DURATION, MAX_MEMBERS);
    await ahorroPay.connect(member1).joinCircle(0);
    await ahorroPay.connect(member2).joinCircle(0);

    for (let r = 0; r < 3; r++) {
      await ahorroPay.connect(owner).contribute(0);
      await ahorroPay.connect(member1).contribute(0);
      await ahorroPay.connect(member2).contribute(0);
    }

    const [, , , , , , , , state] = await ahorroPay.circles(0);
    expect(state).to.equal(2);
  });
});