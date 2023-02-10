import { ethers, network } from "hardhat";
import { expect } from "chai"
import * as dotenv from 'dotenv'
dotenv.config()

const WHALE = `0xcA8Fa8f0b631EcdB18Cda619C4Fc9d197c8aFfCa`;
const DEZMOU = `0xffe6788BE411C4353B3b2c546D0401D4d8B2b3eD`

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
    wrapped_mbc,
  ] =
    await Promise.all([
      ethers.getImpersonatedSigner(DEZMOU),
      ethers.getImpersonatedSigner(WHALE),
      (await ethers.getContractFactory("WrappedMyBlockchainCorner")).deploy(),

    ])
  await imp_whale.sendTransaction({
    to: DEZMOU,
    value: "1000000000000000000000",
  })

  return {
    imp_dezmou,
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
    
  });

});