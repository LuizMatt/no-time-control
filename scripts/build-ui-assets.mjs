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
const CONTROLS_DOWNSCALE = 2;
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

/** Minimum cream ("W") pixels required to classify a connected component as a keycap. */
const MIN_KEYCAP_FACE_PX = 100;

/**
 * Keycaps have large cream ("W") faces and keep their original dark-on-cream tokens.
 * Floating text labels have no keycap face: recolor their dark ink ("K"/"P") to
 * cream ("W") for contrast against dark stage skies, and clear enclosed checkerboard
 * holes / fringe ("L"/"S"/stray "W"/etc.) to transparent (".").
 */
function recolorControlsLabels(grid) {
	const height = grid.length;
	const width = grid[0].length;
	const cells = grid.map((row) => [...row]);
	const visited = new Uint8Array(width * height);

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const startIdx = y * width + x;
			if (visited[startIdx] || cells[y][x] === ".") continue;

			const component = [];
			let creamFaceCount = 0;
			const stack = [x, y];
			visited[startIdx] = 1;

			while (stack.length > 0) {
				const cy = stack.pop();
				const cx = stack.pop();
				const token = cells[cy][cx];
				if (token === "W") creamFaceCount++;
				component.push(cx, cy);

				for (const [dx, dy] of [
					[1, 0],
					[-1, 0],
					[0, 1],
					[0, -1],
				]) {
					const nx = cx + dx;
					const ny = cy + dy;
					if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
					const nIdx = ny * width + nx;
					if (visited[nIdx] || cells[ny][nx] === ".") continue;
					visited[nIdx] = 1;
					stack.push(nx, ny);
				}
			}

			if (creamFaceCount >= MIN_KEYCAP_FACE_PX) continue;
			for (let i = 0; i < component.length; i += 2) {
				const cx = component[i];
				const cy = component[i + 1];
				const token = cells[cy][cx];
				cells[cy][cx] = token === "K" || token === "P" ? "W" : ".";
			}
		}
	}

	return cells.map((row) => row.join(""));
}

// ---- Controls panel ----
const controls = readJpeg("assets-src/ui/controls.jpg");
const controlsBg = floodBackground(controls);
const controlsBox = contentBox(controls, controlsBg, {
	x: 0,
	y: 0,
	w: controls.width,
	h: controls.height,
});
const controlsGrid = recolorControlsLabels(
	downsample(
		controls,
		controlsBg,
		controlsBox,
		Math.round(controlsBox.w / CONTROLS_DOWNSCALE),
		Math.round(controlsBox.h / CONTROLS_DOWNSCALE),
	),
);
writeTokenPng(`${OUT}/controls.png`, controlsGrid);

console.log(`Wrote UI assets to ${OUT} (controls ${controlsGrid[0].length}x${controlsGrid.length})`);
