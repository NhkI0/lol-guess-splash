const fs = require("fs");
const path = require("path");

// Parse command line arguments
const args = process.argv.slice(2);
const useCentered = args.includes("--centered");
const splashType = useCentered ? "centered" : "uncentered";

const BASE_URL =
  "https://raw.communitydragon.org/16.1/plugins/rcp-be-lol-game-data/global/default/v1/champions";
const ASSETS_URL =
  "https://raw.communitydragon.org/16.1/plugins/rcp-be-lol-game-data/global/default/assets/characters";

// Convert champion name to folder name format (lowercase, no spaces/special chars)
function toFolderName(name) {
  const lowerName = name.toLowerCase();

  // Special cases where folder name differs from champion name
  if (lowerName.includes("nunu")) return "nunu";
  if (lowerName.includes("wukong")) return "monkeyking";
  if (lowerName.includes("renata")) return "renata";

  return lowerName
    .replace(/['\s.&]/g, "")
    .replace(/é/g, "e");
}

async function fetchChampionList() {
  const response = await fetch(`${BASE_URL}/`);
  const html = await response.text();

  const jsonFiles = [];
  const regex = /href="(\d+)\.json"/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const id = parseInt(match[1], 10);
    if (id !== -1) {
      jsonFiles.push(id);
    }
  }

  return jsonFiles;
}

async function fetchSkinImagePath(folderName, skinNum) {
  const paddedNum = skinNum.toString().padStart(2, "0");
  const imagesUrl = `${ASSETS_URL}/${folderName}/skins/skin${paddedNum}/images/`;

  try {
    const response = await fetch(imagesUrl);
    if (!response.ok) return null;

    const html = await response.text();

    // Find the splash image (centered or uncentered based on option)
    const splashRegex = new RegExp(`href="([^"]*_splash_${splashType}_[^"]*\\.jpg)"`);
    const match = splashRegex.exec(html);

    if (match) {
      return `${folderName}/skins/skin${paddedNum}/images/${match[1]}`;
    }
  } catch (error) {
    // Silently skip errors
  }

  return null;
}

async function fetchAvailableSkinNumbers(championName) {
  const folderName = toFolderName(championName);
  const skinNumbers = new Set();

  try {
    const response = await fetch(`${ASSETS_URL}/${folderName}/skins/`);
    if (!response.ok) return skinNumbers;

    const html = await response.text();

    // Extract skin numbers from folder names (skin01, skin21, etc.)
    const skinRegex = /href="skin(\d+)\/"/g;
    let match;
    while ((match = skinRegex.exec(html)) !== null) {
      skinNumbers.add(parseInt(match[1], 10));
    }
  } catch (error) {
    console.error(`  Failed to fetch skin folders for ${championName}:`, error.message);
  }

  return skinNumbers;
}

async function fetchChampionData(id) {
  const response = await fetch(`${BASE_URL}/${id}.json`);
  const data = await response.json();
  let aliases = [];

  if (data.name.toLowerCase().includes("doom bot")) {
    return null;
  }

  if (data.name.toLowerCase().includes("bel'veth")) {
    aliases = ["belveth", "bel veth"];
  }

  if (data.name.toLowerCase().includes("cho'gath")) {
    aliases = ["chogath", "cho gath"];
  }

  if (data.name.toLowerCase().includes("dr. mundo")) {
    aliases = ["dr mundo", "mundo"];
  }

  if (data.name.toLowerCase().includes("jarvan iv")) {
    aliases = ["jarvan", "j4"];
  }

  if (data.name.toLowerCase().includes("k'sante")) {
    aliases = ["ksante", "k sante"];
  }

  if (data.name.toLowerCase().includes("kai'sa")) {
    aliases = ["kaisa", "kai sa"];
  }

  if (data.name.toLowerCase().includes("kha'zix")) {
    aliases = ["khazix", "kha zix"];
  }

  if (data.name.toLowerCase().includes("kog'maw")) {
    aliases = ["kogmaw", "kog", "kog maw"];
  }

  if (data.name.toLowerCase().includes("lee sin")) {
    aliases = ["leesin"];
  }

  if (data.name.toLowerCase().includes("master yi")) {
    aliases = ["yi"];
  }

  if (data.name.toLowerCase().includes("nunu & willump")) {
    aliases = ["nunu", "nunu et willump", "nunu willump"]
  }

  if (data.name.toLowerCase().includes("rek'sai")) {
    aliases = ["reksai", "rek sai"];
  }

  if (data.name.toLowerCase().includes("renata glasc")) {
    aliases = ["renata"];
  }

  if (data.name.toLowerCase().includes("tahm kench")) {
    aliases = ["tahmkench"];
  }

  if (data.name.toLowerCase().includes("vel'koz")) {
    aliases = ["velkoz", "vel koz"];
  }

  if (data.name.toLowerCase().includes("xin zhao")) {
    aliases = ["xinzhao", "xin"];
  }

  return {
    id: data.id,
    name: data.name,
    aliases: aliases,
    skinsData: data.skins,
  };
}

async function main() {
  console.log(`Using ${splashType} splash images...`);
  console.log("Fetching champion list...");
  const championIds = await fetchChampionList();
  console.log(`Found ${championIds.length} champions`);

  const champions = [];

  for (const id of championIds) {
    try {
      const champion = await fetchChampionData(id);
      if (champion) {
        const folderName = toFolderName(champion.name);
        const availableSkinNumbers = await fetchAvailableSkinNumbers(champion.name);

        // Build skins object: { "Skin Name": "path/to/image.jpg" }
        const skins = {};
        for (const skin of champion.skinsData) {
          const skinNum = skin.id % 1000;

          // Skip base skin (skinNum 0) and check if folder exists
          if (skinNum === 0) continue;
          if (!availableSkinNumbers.has(skinNum)) continue;

          // Skip skins with a date in parentheses (e.g., "(2022)")
          if (/\(\d{4}\)/.test(skin.name)) continue;

          // Fetch actual image path from the images folder
          const imagePath = await fetchSkinImagePath(folderName, skinNum);
          if (imagePath) {
            skins[skin.name] = imagePath;
          }
        }

        delete champion.skinsData;
        champion.skins = skins;

        champions.push(champion);
        console.log(`Fetched: ${champion.name} (${champion.id}) - ${Object.keys(skins).length} skins`);
      } else {
        console.log(`Skipped: ${id} (Doom Bot)`);
      }
    } catch (error) {
      console.error(`Failed to fetch champion ${id}:`, error.message);
    }
  }

  // Sort by name
  champions.sort((a, b) => a.name.localeCompare(b.name));

  const outputPath = path.join(__dirname, "..", "data", "champions.json");
  const outputDir = path.dirname(outputPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(champions, null, 2));
  console.log(`\nSaved ${champions.length} champions to ${outputPath}`);
}

main().catch(console.error);