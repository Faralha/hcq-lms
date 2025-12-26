// scripts/generate-indonesian-area.js
// Script to generate static Indonesian area data for client-side use

import fs from "fs";
import path from "path";
import * as idnArea from "idn-area-data";

async function main() {
  // You can customize which data you want to export
  // Example: all provinces, cities, districts

  const provinces = await idnArea.getProvinces();
  const cities = await idnArea.getRegencies();

  const data = { provinces, cities };

  const outPath = path.join(
    path.dirname(new URL(import.meta.url).pathname),
    "../public/indonesian-area.json"
  );
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf-8");
  console.log("Indonesian area data generated at:", outPath);
}

main();
