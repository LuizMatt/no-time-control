import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../core/constants";
import { k } from "../core/k";
import { ERAS } from "../data/eras";
import { ERA_TILESETS } from "../data/tilesets";
import type { Era, StageDef } from "../types";
import {
	mergeStageColliders,
	pickAutotileFrame,
	pickInnerBgFrame,
	pickOneWayFrame,
} from "./autotile";

export interface StageBuildInfo {
	mapWidth: number;
	mapHeight: number;
	arenaTopRow: number;
	arenaFloorRow: number;
}

interface PrecomputedPropDraw {
	tx: number;
	ty: number;
	wx: number;
	wy: number;
	frame: number;
	flipX: boolean;
	flipY: boolean;
}

function findArenaBoundsRows(stageDef: StageDef): {
	arenaTopRow: number;
	arenaFloorRow: number;
} {
	const { map } = stageDef;
	const bossTx = stageDef.bossSpawn.tx;
	const floorRow = stageDef.bossSpawn.ty;
	let topRow = 1;
	for (let ty = floorRow - 1; ty >= 0; ty--) {
		if (ty < map.length && bossTx >= 0 && bossTx < map[ty].length && map[ty][bossTx] === "#") {
			topRow = ty + 1;
			break;
		}
	}
	return { arenaTopRow: topRow, arenaFloorRow: floorRow };
}

/**
 * Builds the stage environment using:
 * - 3 camera-culled batched draw layers (`stage-bg` at z=-2, `stage-deco` at z=-1, `stage-tiles` at z=0)
 * - Merged 2D solid colliders and 1D one-way strip colliders with `collisionIgnore: ["platform", "hazard"]`
 */
export function buildStageEnvironment(stageDef: StageDef, era: Era): StageBuildInfo {
	const { tileWidth, tileHeight, map } = stageDef;
	const eraConfig = ERAS[era];
	const tileset = ERA_TILESETS[era];
	const rowCount = map.length;
	const colCount = map[0]?.length ?? 0;

	// Precompute tile frames (-1 = empty) for fast camera-culled batch rendering
	const bgFrames: Int16Array[] = Array.from(
		{ length: rowCount },
		() => new Int16Array(colCount).fill(-1),
	);
	const fgFrames: Int16Array[] = Array.from(
		{ length: rowCount },
		() => new Int16Array(colCount).fill(-1),
	);

	for (let ty = 0; ty < rowCount; ty++) {
		const row = map[ty];
		for (let tx = 0; tx < row.length; tx++) {
			const cell = row[tx];
			if (cell === "#") {
				fgFrames[ty][tx] = pickAutotileFrame(tileset, map, tx, ty);
			} else if (cell === "-") {
				fgFrames[ty][tx] = pickOneWayFrame(tileset, map, tx, ty);
			} else if (cell === "B") {
				bgFrames[ty][tx] = pickInnerBgFrame(tileset, tx, ty);
			} else if (cell === "^") {
				k.add([
					k.polygon([
						k.vec2(4, tileHeight),
						k.vec2(tileWidth / 2, tileHeight - 16),
						k.vec2(tileWidth - 4, tileHeight),
					]),
					k.pos(tx * tileWidth, ty * tileHeight),
					k.color(220, 70, 70),
					k.outline(1, k.rgb(...eraConfig.accentColor)),
					k.area({
						shape: new k.Rect(k.vec2(6, tileHeight - 14), tileWidth - 12, 14),
						collisionIgnore: ["platform", "hazard"],
					}),
					k.z(1),
					"hazard",
				]);
			}
		}
	}

	const getVisibleBounds = (): {
		minTx: number;
		maxTx: number;
		minTy: number;
		maxTy: number;
	} => {
		const cam = k.camPos();
		const halfW = SCREEN_WIDTH / 2 + tileWidth;
		const halfH = SCREEN_HEIGHT / 2 + tileHeight;
		return {
			minTx: Math.max(0, Math.floor((cam.x - halfW) / tileWidth)),
			maxTx: Math.min(colCount - 1, Math.ceil((cam.x + halfW) / tileWidth)),
			minTy: Math.max(0, Math.floor((cam.y - halfH) / tileHeight)),
			maxTy: Math.min(rowCount - 1, Math.ceil((cam.y + halfH) / tileHeight)),
		};
	};

	const drawTileGrid = (grid: Int16Array[]): void => {
		const { minTx, maxTx, minTy, maxTy } = getVisibleBounds();
		for (let ty = minTy; ty <= maxTy; ty++) {
			const row = grid[ty];
			const wy = ty * tileHeight;
			for (let tx = minTx; tx <= maxTx; tx++) {
				const frame = row[tx];
				if (frame < 0) continue;
				k.drawSprite({
					sprite: tileset.sprite,
					frame,
					pos: k.vec2(tx * tileWidth, wy),
				});
			}
		}
	};

	// 1. Batched interior background layer (z = -2)
	k.add([
		k.z(-2),
		"stage-bg",
		{
			draw() {
				drawTileGrid(bgFrames);
			},
		},
	]);

	// 2. Batched props layer (z = -1)
	const propDraws: PrecomputedPropDraw[] = [];
	for (const prop of stageDef.props ?? []) {
		const frame = tileset.props[prop.kind];
		if (frame === undefined) continue;
		propDraws.push({
			tx: prop.tx,
			ty: prop.ty,
			wx: prop.tx * tileWidth,
			wy: prop.ty * tileHeight,
			frame,
			flipX: Boolean(prop.flipX),
			flipY: prop.kind === "ceilingWires",
		});
	}

	k.add([
		k.z(-1),
		"stage-deco",
		{
			draw() {
				const { minTx, maxTx, minTy, maxTy } = getVisibleBounds();
				for (const p of propDraws) {
					if (p.tx < minTx || p.tx > maxTx || p.ty < minTy || p.ty > maxTy) continue;
					k.drawSprite({
						sprite: tileset.sprite,
						frame: p.frame,
						pos: k.vec2(p.wx, p.wy),
						flipX: p.flipX,
						flipY: p.flipY,
					});
				}
			},
		},
	]);

	// 3. Batched foreground tiles layer (`#` and `-`, z = 0)
	k.add([
		k.z(0),
		"stage-tiles",
		{
			draw() {
				drawTileGrid(fgFrames);
			},
		},
	]);

	// 4. Merged static physics colliders
	const { solidRects, oneWayRects } = mergeStageColliders(map);

	for (const rect of solidRects) {
		k.add([
			k.pos(rect.tx * tileWidth, rect.ty * tileHeight),
			k.area({
				shape: new k.Rect(k.vec2(0, 0), rect.w * tileWidth, rect.h * tileHeight),
				collisionIgnore: ["platform", "hazard"],
			}),
			k.body({ isStatic: true }),
			"platform",
			"solidPlatform",
		]);
	}

	for (const rect of oneWayRects) {
		k.add([
			k.pos(rect.tx * tileWidth, rect.ty * tileHeight),
			k.area({
				shape: new k.Rect(k.vec2(0, 0), rect.w * tileWidth, 12),
				collisionIgnore: ["platform", "hazard"],
			}),
			k.body({ isStatic: true }),
			"platform",
			"oneway",
		]);
	}

	const { arenaTopRow, arenaFloorRow } = findArenaBoundsRows(stageDef);
	return {
		mapWidth: colCount * tileWidth,
		mapHeight: rowCount * tileHeight,
		arenaTopRow,
		arenaFloorRow,
	};
}
