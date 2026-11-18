import assert from "node:assert/strict";
import test from "node:test";
import { ERA_TILESETS } from "../src/data/tilesets.ts";
import type { Era, EraTilesetConfig } from "../src/types/index.ts";

const STRUCTURAL_SLOTS: readonly (keyof Omit<EraTilesetConfig, "sprite" | "props">)[] = [
	"topLeft",
	"top",
	"topRight",
	"left",
	"center",
	"right",
	"bottomLeft",
	"bottom",
	"bottomRight",
	"thinLeft",
	"thinMid",
	"thinRight",
	"thinSingle",
	"pillarTop",
	"pillarMid",
	"pillarBottom",
	"innerBg",
	"oneWayLeft",
	"oneWayMid",
	"oneWayRight",
];

test("every era tileset defines valid 8x3 frame indices (0..23) for all 3x3 slots", () => {
	const eras: Era[] = ["past", "present", "future"];
	for (const era of eras) {
		const cfg = ERA_TILESETS[era];
		assert.ok(cfg, `Missing tileset config for ${era}`);
		assert.equal(cfg.sprite, `${era}-tileset`);

		for (const slot of STRUCTURAL_SLOTS) {
			const frames = cfg[slot];
			assert.ok(frames.length > 0, `${era}.${slot} must not be empty`);
			for (const frame of frames) {
				assert.ok(
					Number.isInteger(frame) && frame >= 0 && frame <= 23,
					`${era}.${slot} has out-of-range frame ${frame}`,
				);
			}
		}

		for (const [kind, frame] of Object.entries(cfg.props)) {
			assert.ok(
				typeof frame === "number" && Number.isInteger(frame) && frame >= 0 && frame <= 23,
				`${era}.props.${kind} has invalid frame ${String(frame)}`,
			);
		}
	}
});

test("future tileset keeps ceiling pipe frames out of ground top surface and reserves inner pipes for innerBg", () => {
	const future = ERA_TILESETS.future;
	assert.deepEqual(future.top, [14, 15]);
	assert.ok(future.innerBg.includes(8) && future.innerBg.includes(9));
	assert.ok(future.bottom.includes(5) && future.bottom.includes(4));
});
