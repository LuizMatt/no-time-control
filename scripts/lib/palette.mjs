import fs from "node:fs";
import jpeg from "jpeg-js";
import { PNG } from "pngjs";

export const PALETTE = {
	K: [0x1f, 0x0e, 0x1c],
	P: [0x3e, 0x21, 0x37],
	S: [0x58, 0x45, 0x63],
	L: [0x8c, 0x8f, 0xae],
	B: [0x9a, 0x63, 0x48],
	T: [0xd7, 0x9b, 0x7d],
	W: [0xf5, 0xed, 0xba],
	G: [0x64, 0x7d, 0x34],
	Y: [0xc0, 0xc7, 0x41],
	O: [0xe4, 0x94, 0x3a],
	R: [0x9d, 0x30, 0x3b],
	C: [0xd2, 0x64, 0x71],
	V: [0x70, 0x37, 0x7f],
	D: [0x17, 0x43, 0x4b],
	M: [0x34, 0x85, 0x9d],
	A: [0x7e, 0xc4, 0xc1],
};

/** Returns the palette token whose color is closest (RGB distance) to r,g,b. */
export function nearestToken(r, g, b) {
	let best = "K";
	let bestDist = Infinity;
	for (const [token, [pr, pg, pb]] of Object.entries(PALETTE)) {
		const dist = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
		if (dist < bestDist) {
			bestDist = dist;
			best = token;
		}
	}
	return best;
}

/** Reads a JPG into { width, height, data } (RGBA). */
export function readJpeg(file) {
	return jpeg.decode(fs.readFileSync(file), { useTArray: true });
}

/** Writes a grid of tokens ("." = transparent) to a PNG file. grid is an array of strings. */
export function writeTokenPng(file, grid) {
	const height = grid.length;
	const width = grid[0].length;
	const png = new PNG({ width, height });
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const token = grid[y][x];
			const i = (y * width + x) * 4;
			if (token === ".") {
				png.data[i + 3] = 0;
				continue;
			}
			const [r, g, b] = PALETTE[token];
			png.data[i] = r;
			png.data[i + 1] = g;
			png.data[i + 2] = b;
			png.data[i + 3] = 255;
		}
	}
	fs.writeFileSync(file, PNG.sync.write(png));
}

/** True for neutral, bright pixels (the fake transparency checkerboard). */
function isCheckerLike(r, g, b) {
	const chroma = Math.max(r, g, b) - Math.min(r, g, b);
	return chroma < 14 && (r + g + b) / 3 > 115;
}

/** Marks checkerboard pixels connected to the image edges. Returns Uint8Array (1 = background). */
export function floodBackground(img) {
	const { width, height, data } = img;
	const bg = new Uint8Array(width * height);
	const stack = [];
	const push = (x, y) => {
		if (x < 0 || y < 0 || x >= width || y >= height) return;
		const idx = y * width + x;
		if (bg[idx]) return;
		const p = idx * 4;
		if (!isCheckerLike(data[p], data[p + 1], data[p + 2])) return;
		bg[idx] = 1;
		stack.push(x, y);
	};
	for (let x = 0; x < width; x++) {
		push(x, 0);
		push(x, height - 1);
	}
	for (let y = 0; y < height; y++) {
		push(0, y);
		push(width - 1, y);
	}
	while (stack.length > 0) {
		const y = stack.pop();
		const x = stack.pop();
		push(x + 1, y);
		push(x - 1, y);
		push(x, y + 1);
		push(x, y - 1);
	}
	return bg;
}

/**
 * Downsamples a source box to outW x outH tokens.
 * Each output pixel takes the most common palette token of its block, or "." when most of the block is background.
 */
export function downsample(img, bg, box, outW, outH) {
	const { width, data } = img;
	const rows = [];
	for (let oy = 0; oy < outH; oy++) {
		let row = "";
		for (let ox = 0; ox < outW; ox++) {
			const x0 = box.x + Math.floor((ox * box.w) / outW);
			const x1 = box.x + Math.max(Math.floor(((ox + 1) * box.w) / outW), Math.floor((ox * box.w) / outW) + 1);
			const y0 = box.y + Math.floor((oy * box.h) / outH);
			const y1 = box.y + Math.max(Math.floor(((oy + 1) * box.h) / outH), Math.floor((oy * box.h) / outH) + 1);
			const counts = {};
			let bgCount = 0;
			let total = 0;
			for (let y = y0; y < y1; y++) {
				for (let x = x0; x < x1; x++) {
					total++;
					const idx = y * width + x;
					if (bg[idx]) {
						bgCount++;
						continue;
					}
					const p = idx * 4;
					const token = nearestToken(data[p], data[p + 1], data[p + 2]);
					counts[token] = (counts[token] ?? 0) + 1;
				}
			}
			if (bgCount * 2 > total) {
				row += ".";
				continue;
			}
			let best = "K";
			let bestCount = -1;
			for (const [token, count] of Object.entries(counts)) {
				if (count > bestCount) {
					best = token;
					bestCount = count;
				}
			}
			row += best;
		}
		rows.push(row);
	}
	return rows;
}

/** Bounding box of all non-background pixels inside a source region. */
export function contentBox(img, bg, region) {
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -1;
	let maxY = -1;
	for (let y = region.y; y < region.y + region.h; y++) {
		for (let x = region.x; x < region.x + region.w; x++) {
			if (bg[y * img.width + x]) continue;
			if (x < minX) minX = x;
			if (x > maxX) maxX = x;
			if (y < minY) minY = y;
			if (y > maxY) maxY = y;
		}
	}
	return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}
