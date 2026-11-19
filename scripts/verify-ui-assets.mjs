import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";
import { PALETTE } from "./lib/palette.mjs";

const DIR = "public/sprites/ui";
const EXPECTED = {
	"weapon-axe.png": [32, 32],
	"weapon-pistol.png": [32, 32],
	"weapon-plasma.png": [32, 32],
	"weapon-wolf.png": [32, 32],
};
const allowed = new Set(Object.values(PALETTE).map(([r, g, b]) => `${r},${g},${b}`));
let failed = false;

for (const name of [...Object.keys(EXPECTED), "controls.png"]) {
	const file = path.join(DIR, name);
	if (!fs.existsSync(file)) {
		console.error(`MISSING ${name}`);
		failed = true;
		continue;
	}
	const png = PNG.sync.read(fs.readFileSync(file));
	const want = EXPECTED[name];
	if (want && (png.width !== want[0] || png.height !== want[1])) {
		console.error(`BAD SIZE ${name}: ${png.width}x${png.height}`);
		failed = true;
	}
	let transparent = 0;
	for (let i = 0; i < png.data.length; i += 4) {
		const [r, g, b, a] = [png.data[i], png.data[i + 1], png.data[i + 2], png.data[i + 3]];
		if (a === 0) {
			transparent++;
			continue;
		}
		if (a !== 255 || !allowed.has(`${r},${g},${b}`)) {
			console.error(`BAD PIXEL ${name} @${i / 4}: ${r},${g},${b},${a}`);
			failed = true;
			break;
		}
	}
	console.log(`${name}: ${png.width}x${png.height}, ${transparent} transparent px`);
}
process.exit(failed ? 1 : 0);
