import assert from "node:assert/strict";
import test from "node:test";
import { FALL_DEATH_Y } from "../src/core/constants.ts";
import { STAGE_1 } from "../src/data/stages.ts";

const VALID_CHARS = new Set(["#", "-", "B", "^", "."]);
const PASSABLE_CHARS = new Set([".", "B"]);
// One-way `-` at ty-2 sits 52px+ above ty ground, clearing 48px entity height and flying enemies
const HEADROOM_UPPER_CHARS = new Set([".", "B", "-"]);
const STANDABLE_CHARS = new Set(["#", "-"]);

test("STAGE_1 has expanded 136x26 uniform dimensions and valid tile characters", () => {
	assert.equal(STAGE_1.map.length, 26);
	const width = STAGE_1.map[0].length;
	assert.equal(width, 136);

	for (let ty = 0; ty < STAGE_1.map.length; ty++) {
		const row = STAGE_1.map[ty];
		assert.equal(row.length, width, `Row ${ty} has length ${row.length}, expected ${width}`);
		for (let tx = 0; tx < row.length; tx++) {
			assert.ok(
				VALID_CHARS.has(row[tx]),
				`Invalid tile '${row[tx]}' at (${tx}, ${ty})`,
			);
		}
	}
});

test("all checkpoints, spawns, and bossSpawn rest on solid or one-way ground with headroom", () => {
	const checkAnchor = (label: string, tx: number, ty: number): void => {
		const ground = STAGE_1.map[ty]?.[tx];
		const body1 = STAGE_1.map[ty - 1]?.[tx];
		const body2 = STAGE_1.map[ty - 2]?.[tx];
		assert.ok(
			STANDABLE_CHARS.has(ground),
			`${label} at (${tx}, ${ty}) must have # or - at ty, got '${ground}'`,
		);
		assert.ok(
			PASSABLE_CHARS.has(body1) && HEADROOM_UPPER_CHARS.has(body2),
			`${label} at (${tx}, ${ty}) lacks 2-tile headroom`,
		);
	};

	for (const cp of STAGE_1.checkpoints) {
		checkAnchor(`checkpoint ${cp.id}`, cp.tx, cp.ty);
	}
	for (const [idx, sp] of STAGE_1.spawns.entries()) {
		checkAnchor(`spawn ${idx}`, sp.tx, sp.ty);
	}
	checkAnchor("bossSpawn", STAGE_1.bossSpawn.tx, STAGE_1.bossSpawn.ty);
});

test("boss arena has elevated platforms matching boss_future teleportSpots and ceiling clearance", () => {
	const floorTy = STAGE_1.bossSpawn.ty;
	const ledgeTy = floorTy - 4; // 128px above floorY
	// leftX = 104*32 => +270px = 112.4375 tx; rightX = 135*32 => -180px = 129.375 tx
	assert.equal(STAGE_1.map[ledgeTy][112], "-");
	assert.equal(STAGE_1.map[ledgeTy][129], "-");
});

test("explicit props sit in passable space with valid anchor surfaces", () => {
	assert.ok((STAGE_1.props?.length ?? 0) >= 8, "Expected intentional props on STAGE_1");
	for (const prop of STAGE_1.props ?? []) {
		const cell = STAGE_1.map[prop.ty]?.[prop.tx];
		assert.ok(
			PASSABLE_CHARS.has(cell),
			`Prop ${prop.kind} at (${prop.tx}, ${prop.ty}) overlaps solid '${cell}'`,
		);
		if (prop.kind === "ceilingWires") {
			const ceiling = STAGE_1.map[prop.ty - 1]?.[prop.tx];
			assert.equal(
				ceiling,
				"#",
				`ceilingWires at (${prop.tx}, ${prop.ty}) must hang beneath # at ty - 1, got '${ceiling}'`,
			);
		} else {
			const ground = STAGE_1.map[prop.ty + 1]?.[prop.tx];
			assert.ok(
				STANDABLE_CHARS.has(ground),
				`Prop ${prop.kind} at (${prop.tx}, ${prop.ty}) must rest on # or - at ty + 1, got '${ground}'`,
			);
		}
	}
});

test("FALL_DEATH_Y is bumped to 1050 above expanded mapHeight + 120", () => {
	const mapHeight = STAGE_1.map.length * STAGE_1.tileHeight;
	assert.equal(FALL_DEATH_Y, 1050);
	assert.ok(FALL_DEATH_Y > mapHeight + 120);
});

test("boss doorway at tx=103 is open from rows 18..22 between floor 23 and lintel 17", () => {
	const gateTx = 103;
	assert.equal(STAGE_1.map[23][gateTx], "#");
	for (let row = 18; row <= 22; row++) {
		assert.equal(STAGE_1.map[row][gateTx], ".", `Expected open doorway at row ${row}`);
	}
	assert.equal(STAGE_1.map[17][gateTx], "#");
});

function isStandable(map: readonly string[], tx: number, ty: number): boolean {
	if (ty < 2 || ty >= map.length || tx < 0 || tx >= map[ty].length) return false;
	return (
		STANDABLE_CHARS.has(map[ty][tx]) &&
		PASSABLE_CHARS.has(map[ty - 1][tx]) &&
		HEADROOM_UPPER_CHARS.has(map[ty - 2][tx])
	);
}

function hasClearHorizontal(map: readonly string[], row: number, x1: number, x2: number): boolean {
	if (row < 0 || row >= map.length) return false;
	const lo = Math.min(x1, x2);
	const hi = Math.max(x1, x2);
	for (let x = lo; x <= hi; x++) {
		if (map[row][x] === "#") return false;
	}
	return true;
}

function canTraverse(
	map: readonly string[],
	x1: number,
	y1: number,
	x2: number,
	y2: number,
): boolean {
	if (Math.abs(x2 - x1) > 5) return false;
	const climb = y1 - y2;
	if (climb > 3) return false;

	if (climb >= 0) {
		// Path A: jump up at x1 to y2 (body at y2 - 1), then move horizontally onto (x2, y2)
		let clearRiseA = hasClearHorizontal(map, y2 - 1, x1, x2);
		for (let r = y2; r < y1 && clearRiseA; r++) {
			if (map[r][x1] === "#") clearRiseA = false;
		}
		if (clearRiseA) return true;

		// Path B: move horizontally at y1 - 1 to x2, then rise through one-way `-` at (x2, y2)
		if (map[y2][x2] !== "-") return false;
		if (!hasClearHorizontal(map, y1 - 1, x1, x2)) return false;
		for (let r = y2 + 1; r < y1; r++) {
			if (map[r][x2] === "#") return false;
		}
		return true;
	}

	// Dropping down (y2 > y1)
	if (!hasClearHorizontal(map, y1 - 1, x1, x2)) return false;
	for (let r = y1; r < y2; r++) {
		if (map[r][x2] === "#") return false;
	}
	return true;
}

test("all checkpoints, spawns, bossSpawn, and elevated platforms are reachable from checkpoint 0", () => {
	const map = STAGE_1.map;
	const start = STAGE_1.checkpoints[0];
	const key = (tx: number, ty: number): string => `${tx},${ty}`;

	assert.ok(isStandable(map, start.tx, start.ty), "Checkpoint 0 must be standable");
	const visited = new Set<string>([key(start.tx, start.ty)]);
	const queue: Array<[number, number]> = [[start.tx, start.ty]];

	while (queue.length > 0) {
		const [x1, y1] = queue.shift()!;
		const minX = Math.max(0, x1 - 5);
		const maxX = Math.min(map[0].length - 1, x1 + 5);
		const minY = Math.max(2, y1 - 3);
		const maxY = map.length - 1;

		for (let y2 = minY; y2 <= maxY; y2++) {
			for (let x2 = minX; x2 <= maxX; x2++) {
				const k2 = key(x2, y2);
				if (visited.has(k2) || !isStandable(map, x2, y2)) continue;
				if (canTraverse(map, x1, y1, x2, y2)) {
					visited.add(k2);
					queue.push([x2, y2]);
				}
			}
		}
	}

	for (const cp of STAGE_1.checkpoints) {
		assert.ok(visited.has(key(cp.tx, cp.ty)), `Checkpoint ${cp.id} at (${cp.tx}, ${cp.ty}) unreachable`);
	}
	for (const [idx, sp] of STAGE_1.spawns.entries()) {
		assert.ok(visited.has(key(sp.tx, sp.ty)), `Spawn ${idx} at (${sp.tx}, ${sp.ty}) unreachable`);
	}
	assert.ok(
		visited.has(key(STAGE_1.bossSpawn.tx, STAGE_1.bossSpawn.ty)),
		`bossSpawn at (${STAGE_1.bossSpawn.tx}, ${STAGE_1.bossSpawn.ty}) unreachable`,
	);

	// Every elevated platform (-) and playable rooftop (# at ty >= 10) must be reachable
	for (let ty = 10; ty < map.length; ty++) {
		for (let tx = 0; tx < map[ty].length; tx++) {
			if (!isStandable(map, tx, ty)) continue;
			assert.ok(
				visited.has(key(tx, ty)),
				`Platform tile '${map[ty][tx]}' at (${tx}, ${ty}) is unreachable from checkpoint 0`,
			);
		}
	}
});
