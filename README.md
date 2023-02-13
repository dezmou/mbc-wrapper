# (WIP) MyBlockchainCorner ERC-721 wrapper

## Wrapping process 

First you must set your tile for sale using the original MBC website

Then you use the new contract to wrap your tile. 

Keep in mind than you must set a high price to your tile before wrapping it because some malicious user could be tempted to snipe it. 

Since original contract take a percentage of 5% of all sales, you will lose 5% of the price you set during wrapping. 

But once wrapped, you can trade your tile on openSea for 0% fees. 

## Set HTML 

Once wrapped, you can set the HTML of your tile using the wrapper ERC-721 contract, the HTML will be updated on the original contract. 

## Unwrapping process. 

If you want to unwrap your tile, you call unwrap function with a price, then you have to buy it yoursel on the original contract.

Once you bought it yourself, you must call the wrapper to get back the ETH you spent to buy your tile.

The same caveats for the wrapping process apply here (sniping issue and 5% lose)

# Technical specs 

## Battle tested
The wrapper contract has been tested on every case and isn't vulnerable to attacks
![alt text](./tests.PNG "Tests")

## (WIP) On chain pictures
To preserve the on-chain spirit of the project, no external link (not even IPFS) will be used to display properties and image of the token on website like openSea. 

All data will be generated on chain with a SVG picture showing which page and coordinate is the tile.