import { ethers, network } from "hardhat";
import { expect } from "chai"
import * as dotenv from 'dotenv'
dotenv.config()

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

// const newContext = async () => {
//   const [
//     zStacking,
//     imp_reth_whale,
//     reth,
//     zoomer,
//   ] = await Promise.all([
//     // (await ethers.getContractFactory("ZoomerStacking")).deploy(),
//     // ethers.getImpersonatedSigner(RETH_WHALE),
//     // (new ethers.Contract(RETH, rethAbi, ethers.provider)).deployed(),
//     // (new ethers.Contract(ZOOMER, zoomerAbi, ethers.provider)).deployed()
//   ])

//   await reth.connect(imp_reth_whale)["transfer(address,uint256)"](
//     zStacking.address,
//     ethers.BigNumber.from("20000000000000000000"),
//   );

//   return {
//     reth,
//     zStacking,
//     zoomer
//   }
// }

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
    // const ctx = await newContext();
    const contract = await (await ethers.getContractFactory("WrappedMyBlockchainCorner")).deploy();
    // const res = await contract.chien();

    // const imp_dezmou = await ethers.getImpersonatedSigner(DEZMOU);

    // await ctx.zoomer.connect(imp_dezmou)["setApprovalForAll(address,bool)"](
    //   ctx.zStacking.address,
    //   true,
    // );

    // await ctx.zStacking.connect(imp_dezmou).transferMany([2914, 2913, 2912, 2911])

    // console.log(`Dezmou rETH balance after sending 4 NFT : ${(await ctx.reth.balanceOf(DEZMOU)).toString()} rETH` );
  });


  // it("Send many zoomer to zStacking", async () => {
  //   // const ctx = await newContext();


  //   // const imp_dezmou = await ethers.getImpersonatedSigner(DEZMOU);

  //   // await ctx.zoomer.connect(imp_dezmou)["setApprovalForAll(address,bool)"](
  //   //   ctx.zStacking.address,
  //   //   true,
  //   // );

  //   // await ctx.zStacking.connect(imp_dezmou).transferMany([2914, 2913, 2912, 2911])

  //   // console.log(`Dezmou rETH balance after sending 4 NFT : ${(await ctx.reth.balanceOf(DEZMOU)).toString()} rETH` );
  // });

});