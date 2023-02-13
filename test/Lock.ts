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
  throw `should have failed but have not`
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
    `function percent() public view returns (uint256)`,
    `function setPrice(uint256 page,uint32 x,uint32 y,uint256 price)`,
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

  it("Get page content of original MBC", async () => {
    const ctx = await newContext();
    const res = await ctx.mbc.pages(0, 0, 0);
    expect(res[1]).to.equal("<h1>HELLO WORLD</h1>");
  });

  it("Buy tile on original MBC", async () => {
    const ctx = await newContext();
    await ctx.mbc.connect(ctx.imp_gus).buyTile(0, 0, 1, "hi", { value: ethers.utils.parseEther("15") });
  });

  it("Wrap tile", async () => {
    const ctx = await newContext();
    await ctx.wrapped_mbc.connect(ctx.imp_gus).wrap(0, 0, 1, "", { value: ethers.utils.parseEther("15") });
    const tokenId = await ctx.wrapped_mbc.coordinateToTokenID(0, 0, 1);
    const tokenURI = await ctx.wrapped_mbc.tokenURI(tokenId);
  });

  it("Wrap tile and set HTML", async () => {
    const ctx = await newContext();
    await ctx.wrapped_mbc.connect(ctx.imp_gus).wrap(0, 0, 1, "hi gus", { value: ethers.utils.parseEther("15") });
    const res = await ctx.mbc.pages(0, 0, 1);
    expect(res[1]).to.equal("hi gus");
    await ctx.wrapped_mbc.connect(ctx.imp_gus).setHtml(0, 0, 1, "osirfjior");
    const res2 = await ctx.mbc.pages(0, 0, 1);
    expect(res2[1]).to.equal("osirfjior");
  });

  it("Should fail to set HTML to a non owner tile", async () => {
    const ctx = await newContext();
    await shouldFail(async () => await ctx.wrapped_mbc.connect(ctx.imp_gus).setHtml(0, 0, 1, "I like train"), "");
  });

  it("Wrap tile, transfer it, should fail to set HTML", async () => {
    const ctx = await newContext();
    await ctx.wrapped_mbc.connect(ctx.imp_gus).wrap(0, 0, 1, "hi gus", { value: ethers.utils.parseEther("15") });
    const tokenId = await ctx.wrapped_mbc.getTokenId(0, 0, 1);
    await ctx.wrapped_mbc.connect(ctx.imp_gus).transferFrom(GUS, DEZMOU, tokenId);
    await shouldFail(async () => await ctx.wrapped_mbc.connect(ctx.imp_gus).setHtml(0, 0, 1, "I like train"), "");
  });

  it("Should fail to unwrap non wrapped Tile", async () => {
    const ctx = await newContext();
    await shouldFail(async () => await ctx.wrapped_mbc.connect(ctx.imp_gus).unWrap(0, 0, 1, ethers.utils.parseEther("15")), "");
  });

  it("Should fail to unwrap wrapped non-owner tile", async () => {
    const ctx = await newContext();
    await ctx.wrapped_mbc.connect(ctx.imp_gus).wrap(0, 0, 1, "hi gus", { value: ethers.utils.parseEther("15") });
    await shouldFail(async () => await ctx.wrapped_mbc.connect(ctx.imp_dezmou).unWrap(0, 0, 1, ethers.utils.parseEther("15")), "");
  });

  it("Wrap and unwrap Tile", async () => {
    const ctx = await newContext();
    await ctx.wrapped_mbc.connect(ctx.imp_gus).wrap(0, 0, 1, "hi gus", { value: ethers.utils.parseEther("15") });
    await ctx.wrapped_mbc.connect(ctx.imp_gus).unWrap(0, 0, 1, ethers.utils.parseEther("15"));
  });

  it("Should fail to unwrap already unwrapped tile", async () => {
    const ctx = await newContext();
    await ctx.wrapped_mbc.connect(ctx.imp_gus).wrap(0, 0, 1, "hi gus", { value: ethers.utils.parseEther("15") });
    await ctx.wrapped_mbc.connect(ctx.imp_gus).unWrap(0, 0, 1, ethers.utils.parseEther("15"));
    await shouldFail(async () => await ctx.wrapped_mbc.connect(ctx.imp_gus).unWrap(0, 0, 1, ethers.utils.parseEther("15")), "");
  });


  it("Wrap and unwrap Tile, buy it with the original contract", async () => {
    const ctx = await newContext();
    await ctx.wrapped_mbc.connect(ctx.imp_gus).wrap(0, 0, 1, "hi gus", { value: ethers.utils.parseEther("15") });
    await ctx.wrapped_mbc.connect(ctx.imp_gus).unWrap(0, 0, 1, ethers.utils.parseEther("1"));
    await ctx.mbc.connect(ctx.imp_gus).buyTile(0, 0, 1, "hi", { value: ethers.utils.parseEther("1") })
    const res = await ctx.mbc.pages(0, 0, 1);
    expect(res[0]).to.equal(GUS);
  });

  it("Unwrap Tile, claim back eth used to unwrap", async () => {
    const ctx = await newContext();
    await ctx.wrapped_mbc.connect(ctx.imp_gus).wrap(0, 0, 1, "hi gus", { value: ethers.utils.parseEther("15") });
    await ctx.wrapped_mbc.connect(ctx.imp_gus).unWrap(0, 0, 1, ethers.utils.parseEther("1"));
    await ctx.mbc.connect(ctx.imp_gus).buyTile(0, 0, 1, "hi", { value: ethers.utils.parseEther("1") })
    const tmpGusBalance = await ethers.provider.getBalance(GUS);
    await ctx.wrapped_mbc.connect(ctx.imp_gus).claimEthFromUnwrappedTile(0, 0, 1);
    const finalGusBalance = await ethers.provider.getBalance(GUS);
    const res = ethers.utils.formatEther(finalGusBalance.sub(tmpGusBalance));
    expect(res.startsWith("0.94")).to.equal(true);
  });

  it("Should fail to claim ETH from unwraped tile that aren't your", async () => {
    const ctx = await newContext();
    await ctx.wrapped_mbc.connect(ctx.imp_gus).wrap(0, 0, 1, "hi gus", { value: ethers.utils.parseEther("15") });
    await ctx.wrapped_mbc.connect(ctx.imp_gus).unWrap(0, 0, 1, ethers.utils.parseEther("1"));
    await ctx.mbc.connect(ctx.imp_gus).buyTile(0, 0, 1, "hi", { value: ethers.utils.parseEther("1") })
    await shouldFail(async () => await ctx.wrapped_mbc.connect(ctx.imp_dezmou).claimEthFromUnwrappedTile(0, 0, 1), "");
  });

  it("Unwrap Tile,someone else buy it, last owner claim back eth used to unwrap", async () => {
    const ctx = await newContext();
    await ctx.wrapped_mbc.connect(ctx.imp_gus).wrap(0, 0, 1, "hi gus", { value: ethers.utils.parseEther("15") });
    await ctx.wrapped_mbc.connect(ctx.imp_gus).unWrap(0, 0, 1, ethers.utils.parseEther("1"));
    await ctx.mbc.connect(ctx.imp_dezmou).buyTile(0, 0, 1, "hi", { value: ethers.utils.parseEther("1") })
    const tmpGusBalance = await ethers.provider.getBalance(GUS);
    console.log(tmpGusBalance);
    await ctx.wrapped_mbc.connect(ctx.imp_gus).claimEthFromUnwrappedTile(0, 0, 1);
    const finalGusBalance = await ethers.provider.getBalance(GUS);
    const res = ethers.utils.formatEther(finalGusBalance.sub(tmpGusBalance));
    expect(res.startsWith("0.94")).to.equal(true);
  });

  it("Should fail to claim ETH from unwraping twice", async () => {
    const ctx = await newContext();
    await ctx.wrapped_mbc.connect(ctx.imp_gus).wrap(0, 0, 1, "hi gus", { value: ethers.utils.parseEther("15") });
    await ctx.wrapped_mbc.connect(ctx.imp_gus).unWrap(0, 0, 1, ethers.utils.parseEther("1"));
    await ctx.mbc.connect(ctx.imp_gus).buyTile(0, 0, 1, "hi", { value: ethers.utils.parseEther("1") })
    await ctx.wrapped_mbc.connect(ctx.imp_gus).claimEthFromUnwrappedTile(0, 0, 1);
    await shouldFail(async () => await ctx.wrapped_mbc.connect(ctx.imp_gus).claimEthFromUnwrappedTile(0, 0, 1), "");
  });

  it("Unwrap tile, someone else wrap it, last owner get ETH", async () => {
    const ctx = await newContext();
    await ctx.wrapped_mbc.connect(ctx.imp_gus).wrap(0, 0, 1, "hi gus", { value: ethers.utils.parseEther("15") });
    await ctx.wrapped_mbc.connect(ctx.imp_gus).unWrap(0, 0, 1, ethers.utils.parseEther("1"));
    const gusBalance = await ethers.provider.getBalance(GUS);
    await ctx.mbc.connect(ctx.imp_dezmou).buyTile(0, 0, 1, "soupe", { value: ethers.utils.parseEther("1") });
    await ctx.mbc.connect(ctx.imp_dezmou).setPrice(0, 0, 1, ethers.utils.parseEther("2"));
    await ctx.wrapped_mbc.connect(ctx.imp_dezmou).wrap(0, 0, 1, "I like train", { value: ethers.utils.parseEther("2") });
    const gusBalanceAfter = await ethers.provider.getBalance(GUS);
    const res = ethers.utils.formatEther(gusBalanceAfter.sub(gusBalance));
    expect(res).to.equal("0.95");
  });

  it("Unwrap tile, someone else wrap it, last owner get ETH and cannot claim ETH anymore", async () => {
    const ctx = await newContext();
    await ctx.wrapped_mbc.connect(ctx.imp_gus).wrap(0, 0, 1, "hi gus", { value: ethers.utils.parseEther("15") });
    await ctx.wrapped_mbc.connect(ctx.imp_gus).unWrap(0, 0, 1, ethers.utils.parseEther("1"));
    const gusBalance = await ethers.provider.getBalance(GUS);
    await ctx.mbc.connect(ctx.imp_dezmou).buyTile(0, 0, 1, "soupe", { value: ethers.utils.parseEther("1") });
    await ctx.mbc.connect(ctx.imp_dezmou).setPrice(0, 0, 1, ethers.utils.parseEther("2"));
    await ctx.wrapped_mbc.connect(ctx.imp_dezmou).wrap(0, 0, 1, "I like train", { value: ethers.utils.parseEther("2") });
    const gusBalanceAfter = await ethers.provider.getBalance(GUS);
    const res = ethers.utils.formatEther(gusBalanceAfter.sub(gusBalance));
    expect(res).to.equal("0.95");
    await shouldFail(async () => await ctx.wrapped_mbc.connect(ctx.imp_gus).claimEthFromUnwrappedTile(0, 0, 1), "");
  });

});

