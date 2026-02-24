import { JavaToTypescriptConverter } from "java2typescript/output/index.js";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function run() {
    try {
  
        const packageRoot = resolve(__dirname, "./src/main/java");
        const outputPath = resolve(__dirname, "./ts-engine-converted");
        
        const config = {
            packageRoot: packageRoot,
            outputPath: outputPath,
            include: ["**/*.java"],
        };
        
        console.log("\n🚀 Starting JCloisterZone conversion...");
        console.log("Package Root:", config.packageRoot);
        
        const converter = new JavaToTypescriptConverter(config);
        await converter.startConversion();
        
        console.log("✅ Done! Files generated in ./ts-engine-converted");
    } catch (err) {
        console.error("❌ Conversion failed:", err.message);
    }
}
run();