import { ethers, network } from "hardhat";
import { expect } from "chai"
import * as dotenv from 'dotenv'
dotenv.config()

const MBC = "0x8C051C68D9601771CE96d4c9e971985aeDE480f7";
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
  throw `${action.name} should have failed but have not`
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

  const mbc = new ethers.Contract(MBC, [
    `function buyTile(uint256 page,uint32 x,uint32 y,string calldata html) public payable`,
    `function pages(uint256,uint256,uint256) public view returns (address, string, uint256)`,
  ], ethers.provider);

  return {
    imp_dezmou,
    imp_gus,
    wrapped_mbc,
    mbc,
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

  // it("Get page content of original MBC", async () => {
  //   const ctx = await newContext();
  //   const res = await ctx.mbc.pages(0, 0, 0);
  //   expect(res[1]).to.equal("<h1>HELLO WORLD</h1>");
  // });

  // it("Buy tile on original MBC", async () => {
  //   const ctx = await newContext();
  //   await ctx.mbc.connect(ctx.imp_gus).buyTile(0, 0, 1, "hi", { value: ethers.utils.parseEther("15") });
  // });

  it("Wrap tile", async () => {
    const ctx = await newContext();
    await ctx.wrapped_mbc.connect(ctx.imp_gus).wrap(0, 0, 1, "", { value: ethers.utils.parseEther("15") });
    const tokenId =  await ctx.wrapped_mbc.coordinateToTokenID(0,0,1);
    const tokenURI = await ctx.wrapped_mbc.tokenURI(tokenId);
    console.log(tokenURI);
  });

  // it("Wrap tile and set HTML", async () => {
  //   const ctx = await newContext();
  //   await ctx.wrapped_mbc.connect(ctx.imp_gus).wrap(0, 0, 1, "hi gus", { value: ethers.utils.parseEther("15") });
  //   const res = await ctx.mbc.pages(0, 0, 1);
  //   expect(res[1]).to.equal("hi gus");
  //   await ctx.wrapped_mbc.connect(ctx.imp_gus).setHtml(0, 0, 1, "osirfjior");
  //   const res2 = await ctx.mbc.pages(0, 0, 1);
  //   expect(res2[1]).to.equal("osirfjior");
  // });
});

