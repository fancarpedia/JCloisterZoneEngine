import { readFileSync } from "fs";
import { resolveXmlPaths, buildWireLines } from "./scripts/jcz-wire.mjs";
const jcz = JSON.parse(readFileSync("engine-tests/courier/courier-move-to-castle-north-then-to-castle-south.jcz","utf8"));
const paths = resolveXmlPaths(jcz.setup.sets, "xmls");
const lines = buildWireLines(jcz, paths);
const { DOMParser } = await import("@xmldom/xmldom");
const xmlmod = await import("./dist/com/jcloisterzone/XmlUtils.js");
xmlmod.setDomParserFactory(() => new DOMParser());
const { Engine } = await import("./dist/com/jcloisterzone/engine/Engine.js");
const engine = new Engine((p) => readFileSync(p, "utf8"));
let n = 0;
for (const line of lines) {
  try {
    const r = engine.processInput(line);
    if (r !== null) n++;
  } catch (e) {
    console.log("FAILED at wire line", lines.indexOf(line), "state count", n);
    console.log("message:", line.slice(0, 200));
    console.log("error:", e.message);
    process.exit(0);
  }
}
console.log("completed", n, "states");
