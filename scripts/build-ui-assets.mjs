import fs from "node:fs";
import {
	contentBox,
	downsample,
	floodBackground,
	readJpeg,
	writeTokenPng,
} from "./lib/palette.mjs";

const OUT = "public/sprites/ui";
const ICON_SIZE = 32;
/** Pixels of frame border kept when painting the wolf icon background. */
const FRAME_INSET = 4;

fs.mkdirSync(OUT, { recursive: true });

// ---- Weapon frames: find the 3 frames by column projection of non-background pixels ----
const weapons = readJpeg("assets-src/ui/weapons.jpg");
const weaponsBg = floodBackground(weapons);

function findColumnRuns(img, bg) {
	const runs = [];
	let start = -1;
	for (let x = 0; x <= img.width; x++) {
		let hasContent = false;
		if (x < img.width) {
			for (let y = 0; y < img.height; y++) {
				if (!bg[y * img.width + x]) {
					hasContent = true;
					break;
				}
			}
		}
		if (hasContent && start < 0) start = x;
		if (!hasContent && start >= 0) {
			if (x - start > 40) runs.push({ x: start, w: x - start });
			start = -1;
		}
	}
	return runs;
}

const runs = findColumnRuns(weapons, weaponsBg);
if (runs.length !== 3) {
	throw new Error(`Expected 3 weapon frames, found ${runs.length}: ${JSON.stringify(runs)}`);
}

const names = ["weapon-axe", "weapon-pistol", "weapon-plasma"];
const grids = {};
runs.forEach((run, i) => {
	const box = contentBox(weapons, weaponsBg, { x: run.x, y: 0, w: run.w, h: weapons.height });
	const grid = downsample(weapons, weaponsBg, box, ICON_SIZE, ICON_SIZE);
	grids[names[i]] = grid;
	writeTokenPng(`${OUT}/${names[i]}.png`, grid);
});

// ---- Wolf face: reuse the pistol frame, repaint the interior, stamp a mirrored head ----
// Left half of the head (10 cols). Col 9 is the center line; the right half is the mirror.
const WOLF_HALF = [
	"..KK......",
	".KSSK.....",
	".KSLSK....",
	".KSLSSKKKK",
	".KSSSSSSSS",
	"KSSLLSSSSL",
	"KSLLSSSSLL",
	"KSLKKOOSLL",
	"KSLSKOOSLL",
	"KSSSSKSLLL",
	".KSSSSSLWW",
	".KSSLLLWWW",
	"..KSLLWWWW",
	"..KSLLWKKK",
	"...KSLWWWW",
	"...KSSLWKW",
	"....KSSKKK",
	".....KKK..",
];
const wolfHead = WOLF_HALF.map((half) => half + [...half].reverse().join(""));
const WOLF_X = Math.floor((ICON_SIZE - wolfHead[0].length) / 2);
const WOLF_Y = Math.floor((ICON_SIZE - wolfHead.length) / 2);

const wolf = grids["weapon-pistol"].map((row) => [...row]);
for (let y = FRAME_INSET; y < ICON_SIZE - FRAME_INSET; y++) {
	for (let x = FRAME_INSET; x < ICON_SIZE - FRAME_INSET; x++) {
		wolf[y][x] = y < 20 ? "D" : "P";
	}
}
wolfHead.forEach((row, dy) => {
	[...row].forEach((token, dx) => {
		if (token !== ".") wolf[WOLF_Y + dy][WOLF_X + dx] = token;
	});
});
writeTokenPng(`${OUT}/weapon-wolf.png`, wolf.map((row) => row.join("")));

console.log(`Wrote weapon UI assets to ${OUT}`);
