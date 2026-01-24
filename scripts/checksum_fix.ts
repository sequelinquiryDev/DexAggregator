
import { getAddress, isAddress } from "ethers";
import fs from "fs/promises";
import path from "path";

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const poolsPolygonPath = path.resolve(__dirname, "../server/data/pools_polygon.json");
const tokensPath = path.resolve(__dirname, "../server/data/tokens.json");

async function fixPoolsPolygonChecksums() {
  try {
    const poolsPolygonContent = await fs.readFile(poolsPolygonPath, "utf-8");
    const poolsPolygon = JSON.parse(poolsPolygonContent);

    const correctedPoolsPolygon: Record<string, string> = {};

    for (const key in poolsPolygon) {
      try {
        const value = poolsPolygon[key];
        const correctedValue = getAddress(value);

        const parts = key.split("_");
        const correctedParts = parts.map((part) => {
          if (part.startsWith("0x") && isAddress(part)) {
            try {
              return getAddress(part);
            } catch (e) {
              return part; // Keep original if it fails
            }
          }
          return part;
        });
        const correctedKey = correctedParts.join("_");

        correctedPoolsPolygon[correctedKey] = correctedValue;
      } catch (error) {
        console.warn(`Skipping invalid key in pools_polygon.json: ${key}`);
        continue;
      }
    }

    await fs.writeFile(poolsPolygonPath, JSON.stringify(correctedPoolsPolygon, null, 2));
    console.log("Successfully checksummed server/data/pools_polygon.json");
  } catch (error) {
    console.error("Error processing server/data/pools_polygon.json:", error);
  }
}

async function fixTokensChecksums() {
  try {
    const tokensContent = await fs.readFile(tokensPath, "utf-8");
    const tokens = JSON.parse(tokensContent);

    const correctedTokens = tokens.map((token: any) => {
      if (isAddress(token.address)) {
        return {
          ...token,
          address: getAddress(token.address),
        };
      }
      return token;
    });

    await fs.writeFile(tokensPath, JSON.stringify(correctedTokens, null, 2));
    console.log("Successfully checksummed server/data/tokens.json");
  } catch (error) {
    console.error("Error processing server/data/tokens.json:", error);
  }
}

async function fixAllChecksums() {
  await fixPoolsPolygonChecksums();
  await fixTokensChecksums();
}

fixAllChecksums();
