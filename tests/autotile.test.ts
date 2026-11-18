import assert from "node:assert/strict";
import test from "node:test";
import { STAGE_1 } from "../src/data/stages.ts";
import {
	mergeStageColliders,
	pickAutotileFrame,
	pickInnerBgFrame,
	pickOneWayFrame,
} from "../src/systems/autotile.ts";
import type { EraTilesetConfig } from "../src/types/index.ts";

const MOCK_TILESET: EraTilesetConfig = {
	sprite: "mock",
	topLeft: [0],
	top: [1],
	topRight: [2],
	left: [3],
	center: [4],
	right: [5],
	bottomLeft: [6],
	bottom: [7],
	bottomRight: [8],
	thinLeft: [9],
	thinMid: [10],
	thinRight: [11],
	thinSingle: [12],
	pillarTop: [13],
	pillarMid: [14],
	pillarBottom: [15],
	innerBg: [16, 17],
	oneWayLeft: [18],
	oneWayMid: [19],
	oneWayRight: [20],
	props: {},
};

test("pickAutotileFrame resolves all 9 positions of a 3x3 solid block", () => {
	const map = [
		".....",
		".###.",
		".###.",
		".###.",
		".....",
	];
	assert.equal(pickAutotileFrame(MOCK_TILESET, map, 1, 1), 0); // topLeft
	assert.equal(pickAutotileFrame(MOCK_TILESET, map, 2, 1), 1); // top
	assert.equal(pickAutotileFrame(MOCK_TILESET, map, 3, 1), 2); // topRight
	assert.equal(pickAutotileFrame(MOCK_TILESET, map, 1, 2), 3); // left
	assert.equal(pickAutotileFrame(MOCK_TILESET, map, 2, 2), 4); // center
	assert.equal(pickAutotileFrame(MOCK_TILESET, map, 3, 2), 5); // right
	assert.equal(pickAutotileFrame(MOCK_TILESET, map, 1, 3), 6); // bottomLeft
	assert.equal(pickAutotileFrame(MOCK_TILESET, map, 2, 3), 7); // bottom
	assert.equal(pickAutotileFrame(MOCK_TILESET, map, 3, 3), 8); // bottomRight
});

test("pickAutotileFrame resolves 1-tile beams, pillars, and isolated blocks", () => {
	const map = [
		".......",
		".###.#.",
		".......",
		"...#...",
		"...#...",
		"...#...",
		".......",
	];
	assert.equal(pickAutotileFrame(MOCK_TILESET, map, 1, 1), 9); // thinLeft
	assert.equal(pickAutotileFrame(MOCK_TILESET, map, 2, 1), 10); // thinMid
	assert.equal(pickAutotileFrame(MOCK_TILESET, map, 3, 1), 11); // thinRight
	assert.equal(pickAutotileFrame(MOCK_TILESET, map, 5, 1), 12); // thinSingle
	assert.equal(pickAutotileFrame(MOCK_TILESET, map, 3, 3), 13); // pillarTop
	assert.equal(pickAutotileFrame(MOCK_TILESET, map, 3, 4), 14); // pillarMid
	assert.equal(pickAutotileFrame(MOCK_TILESET, map, 3, 5), 15); // pillarBottom
});

test("pickOneWayFrame resolves left/mid/right and pickInnerBgFrame cycles deterministically", () => {
	const map = [".---."];
	assert.equal(pickOneWayFrame(MOCK_TILESET, map, 1, 0), 18);
	assert.equal(pickOneWayFrame(MOCK_TILESET, map, 2, 0), 19);
	assert.equal(pickOneWayFrame(MOCK_TILESET, map, 3, 0), 20);
	assert.ok([16, 17].includes(pickInnerBgFrame(MOCK_TILESET, 4, 2)));
});

test("boundary tiles, isolated one-way platforms, and variant determinism behave consistently", () => {
	const boundaryMap = [
		"###",
		"###",
	];
	// Top row treats ty < 0 as open, left/right edges as solid -> top surface
	assert.equal(pickAutotileFrame(MOCK_TILESET, boundaryMap, 0, 0), 1); // top
	assert.equal(pickAutotileFrame(MOCK_TILESET, boundaryMap, 2, 0), 1); // top
	// Bottom row treats ty >= length and side edges as solid -> center
	assert.equal(pickAutotileFrame(MOCK_TILESET, boundaryMap, 0, 1), 4); // center
	assert.equal(pickAutotileFrame(MOCK_TILESET, boundaryMap, 2, 1), 4); // center

	// Isolated one-way uses thinSingle; one-way adjacent to solid connects to it
	const oneWayMap = [".-.#-#."];
	assert.equal(pickOneWayFrame(MOCK_TILESET, oneWayMap, 1, 0), 12); // thinSingle
	assert.equal(pickOneWayFrame(MOCK_TILESET, oneWayMap, 4, 0), 19); // oneWayMid

	// pickInnerBgFrame is deterministic for a given coordinate
	const first = pickInnerBgFrame(MOCK_TILESET, 4, 2);
	const second = pickInnerBgFrame(MOCK_TILESET, 4, 2);
	assert.equal(first, second);

	// Empty variant pools fall back safely to frame 0
	const emptyTileset: EraTilesetConfig = { ...MOCK_TILESET, innerBg: [] };
	assert.equal(pickInnerBgFrame(emptyTileset, 4, 2), 0);
});

test("mergeStageColliders merges contiguous # into 2D rects and - into 1D strips with exact coverage", () => {
	const { solidRects, oneWayRects } = mergeStageColliders(STAGE_1.map);
	const H = STAGE_1.map.length;
	const W = STAGE_1.map[0].length;

	// Massive reduction from 600+ individual tile colliders to <= 55 merged colliders
	assert.ok(
		solidRects.length + oneWayRects.length <= 55,
		`Expected <= 55 merged colliders, got ${solidRects.length + oneWayRects.length}`,
	);

	const solidGrid = Array.from({ length: H }, () => new Uint8Array(W));
	for (const r of solidRects) {
		for (let dy = 0; dy < r.h; dy++) {
			for (let dx = 0; dx < r.w; dx++) {
				solidGrid[r.ty + dy][r.tx + dx] += 1;
			}
		}
	}

	const oneWayGrid = Array.from({ length: H }, () => new Uint8Array(W));
	for (const r of oneWayRects) {
		assert.equal(r.h, 1, "One-way platforms must merge horizontally with h = 1");
		for (let dx = 0; dx < r.w; dx++) {
			oneWayGrid[r.ty][r.tx + dx] += 1;
		}
	}

	for (let ty = 0; ty < H; ty++) {
		for (let tx = 0; tx < W; tx++) {
			const cell = STAGE_1.map[ty][tx];
			assert.equal(solidGrid[ty][tx], cell === "#" ? 1 : 0, `Mismatch # at (${tx}, ${ty})`);
			assert.equal(oneWayGrid[ty][tx], cell === "-" ? 1 : 0, `Mismatch - at (${tx}, ${ty})`);
		}
	}
});
