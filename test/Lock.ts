import { ethers, network } from "hardhat";
import { expect } from "chai"
import * as dotenv from 'dotenv'
dotenv.config()

const WHALE = `0xcA8Fa8f0b631EcdB18Cda619C4Fc9d197c8aFfCa`;
const DEZMOU = `0xffe6788BE411C4353B3b2c546D0401D4d8B2b3eD`;
const GUS = `0x1b3cB81E51011b549d78bf720b0d924ac763A7C2`;

const shouldFail = async (action: Function, searchString: string) => {
  try {
    await action()
  } catch (e: any) {
    if (e.toString().indexOf(searchString) === -1) {
      throw `Should have fail with "${searchString}" included in error instead got : ${e.toString()}`
    }
    return e;
  }
  throw "Should have failed"
}

const newContext = async () => {
  const [
    imp_dezmou,
    imp_whale,
    imp_gus,
    wrapped_mbc,
  ] =
    await Promise.all([
      ethers.getImpersonatedSigner(DEZMOU),
      ethers.getImpersonatedSigner(WHALE),
      ethers.getImpersonatedSigner(GUS),
      (await ethers.getContractFactory("WrappedMyBlockchainCorner")).deploy(),

    ])
  await imp_whale.sendTransaction({
    to: DEZMOU,
    value: "1000000000000000000000",
  })

  return {
    imp_dezmou,
    imp_gus,
    wrapped_mbc,
  }

}

describe("Main tests", function () {
  beforeEach(async function () {
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: process.env.RPC_URL,
          },
        },
      ],
    });
  });


  it("Chien", async () => {
    const ctx = await newContext();
    const res = await ctx.wrapped_mbc.connect(ctx.imp_gus).wrap(0,0,1, {value : ethers.utils.parseEther("15")});
  });
});