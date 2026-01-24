
import { getAddress, isAddress } from "ethers";
import fs from "fs/promises";
import path from "path";

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const tokensPath = path.resolve(__dirname, "../server/data/tokens.json");

async function fixTokensChecksums() {
  try {
    const tokensContent = await fs.readFile(tokensPath, "utf-8");
    console.log("Original tokens.json content:", tokensContent);
    const tokens = JSON.parse(tokensContent);

    const correctedTokens = tokens.map((token: any) => {
      if (isAddress(token.address)) {
        const originalAddress = token.address;
        const checksummedAddress = getAddress(token.address);
        if(originalAddress !== checksummedAddress) {
            console.log(`Fixing address for ${token.symbol} on chain ${token.chainId}: ${originalAddress} -> ${checksummedAddress}`);
            return {
              ...token,
              address: checksummedAddress,
            };
        }
      }
      return token;
    });

    const newTokensContent = JSON.stringify(correctedTokens, null, 2);
    console.log("New tokens.json content:", newTokensContent);

    await fs.writeFile(tokensPath, newTokensContent);
    console.log("Successfully wrote to server/data/tokens.json");

    const finalTokensContent = await fs.readFile(tokensPath, "utf-8");
    console.log("Final tokens.json content:", finalTokensContent);

  } catch (error) {
    console.error("Error processing server/data/tokens.json:", error);
  }
}

fixTokensChecksums();
