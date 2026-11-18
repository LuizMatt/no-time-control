import type { EraTilesetConfig } from "../types";

function pickVariant(pool: readonly number[], tx: number, ty: number): number {
	if (pool.length === 0) return 0;
	const hash = Math.abs(tx * 7 + ty * 13);
	return pool[hash % pool.length];
}

function isSolidAt(map: readonly string[], tx: number, ty: number): boolean {
	if (ty < 0) return false;
	if (ty >= map.length) return true;
	const row = map[ty];
	if (tx < 0 || tx >= row.length) return true;
	return row[tx] === "#";
}

function isOneWayAt(map: readonly string[], tx: number, ty: number): boolean {
	if (ty < 0 || ty >= map.length) return false;
	const row = map[ty];
	if (tx < 0 || tx >= row.length) return false;
	return row[tx] === "-";
}

/** Selects the 3x3 autotile frame (including 1-tile beams and pillars) for a solid `#` cell. */
export function pickAutotileFrame(
	tileset: EraTilesetConfig,
	map: readonly string[],
	tx: number,
	ty: number,
): number {
	const up = isSolidAt(map, tx, ty - 1);
	const down = isSolidAt(map, tx, ty + 1);
	const left = isSolidAt(map, tx - 1, ty);
	const right = isSolidAt(map, tx + 1, ty);

	if (!up && !down && !left && !right) {
		return pickVariant(tileset.thinSingle, tx, ty);
	}

	// 1-tile horizontal beam
	if (!up && !down) {
		if (!left) return pickVariant(tileset.thinLeft, tx, ty);
		if (!right) return pickVariant(tileset.thinRight, tx, ty);
		return pickVariant(tileset.thinMid, tx, ty);
	}

	// 1-tile vertical pillar
	if (!left && !right) {
		if (!up) return pickVariant(tileset.pillarTop, tx, ty);
		if (!down) return pickVariant(tileset.pillarBottom, tx, ty);
		return pickVariant(tileset.pillarMid, tx, ty);
	}

	// 3x3 block surfaces and corners
	if (!up) {
		if (!left) return pickVariant(tileset.topLeft, tx, ty);
		if (!right) return pickVariant(tileset.topRight, tx, ty);
		return pickVariant(tileset.top, tx, ty);
	}

	if (!down) {
		if (!left) return pickVariant(tileset.bottomLeft, tx, ty);
		if (!right) return pickVariant(tileset.bottomRight, tx, ty);
		return pickVariant(tileset.bottom, tx, ty);
	}

	if (!left) return pickVariant(tileset.left, tx, ty);
	if (!right) return pickVariant(tileset.right, tx, ty);
	return pickVariant(tileset.center, tx, ty);
}

/** Selects left/mid/right frame for a `-` one-way platform tile. */
export function pickOneWayFrame(
	tileset: EraTilesetConfig,
	map: readonly string[],
	tx: number,
	ty: number,
): number {
	const left = isOneWayAt(map, tx - 1, ty) || isSolidAt(map, tx - 1, ty);
	const right = isOneWayAt(map, tx + 1, ty) || isSolidAt(map, tx + 1, ty);
	if (!left && !right) return pickVariant(tileset.thinSingle, tx, ty);
	if (!left) return pickVariant(tileset.oneWayLeft, tx, ty);
	if (!right) return pickVariant(tileset.oneWayRight, tx, ty);
	return pickVariant(tileset.oneWayMid, tx, ty);
}

/** Selects a deterministic interior background frame for a `B` tile. */
export function pickInnerBgFrame(
	tileset: EraTilesetConfig,
	tx: number,
	ty: number,
): number {
	return pickVariant(tileset.innerBg, tx, ty);
}

export interface MergedTileRect {
	tx: number;
	ty: number;
	w: number;
	h: number;
}

/**
 * Merges contiguous `#` cells into maximal 2D rectangles and contiguous `-` cells into
 * 1D horizontal strips so the physics engine processes ~40 colliders instead of 600+.
 */
export function mergeStageColliders(map: readonly string[]): {
	solidRects: MergedTileRect[];
	oneWayRects: MergedTileRect[];
} {
	const height = map.length;
	const width = map[0]?.length ?? 0;
	const usedSolid = Array.from({ length: height }, () => new Uint8Array(width));
	const solidRects: MergedTileRect[] = [];
	const oneWayRects: MergedTileRect[] = [];

	for (let ty = 0; ty < height; ty++) {
		const row = map[ty];
		let tx = 0;
		while (tx < row.length) {
			if (row[tx] !== "-") {
				tx++;
				continue;
			}
			let w = 1;
			while (tx + w < row.length && row[tx + w] === "-") {
				w++;
			}
			oneWayRects.push({ tx, ty, w, h: 1 });
			tx += w;
		}

		for (let sx = 0; sx < row.length; sx++) {
			if (row[sx] !== "#" || usedSolid[ty][sx] === 1) continue;

			let w = 1;
			while (sx + w < row.length && row[sx + w] === "#" && usedSolid[ty][sx + w] === 0) {
				w++;
			}

			let h = 1;
			expandY: while (ty + h < height) {
				const nextRow = map[ty + h];
				for (let dx = 0; dx < w; dx++) {
					if (nextRow[sx + dx] !== "#" || usedSolid[ty + h][sx + dx] === 1) {
						break expandY;
					}
				}
				h++;
			}

			for (let dy = 0; dy < h; dy++) {
				for (let dx = 0; dx < w; dx++) {
					usedSolid[ty + dy][sx + dx] = 1;
				}
			}
			solidRects.push({ tx: sx, ty, w, h });
		}
	}

	return { solidRects, oneWayRects };
}
