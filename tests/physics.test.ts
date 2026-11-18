import assert from "node:assert/strict";
import test from "node:test";
import type { Collision } from "kaplay";
import {
	shouldResolveOneWaySurface,
	shouldResolvePlatformCollision,
} from "../src/core/physics.ts";

test("shouldResolveOneWaySurface resolves only when falling onto top edge from above", () => {
	assert.equal(
		shouldResolveOneWaySurface({
			isBottom: true,
			velY: 120,
			sourceFootY: 324,
			targetTopY: 320,
		}),
		true,
	);

	// Jumping up from below must pass through
	assert.equal(
		shouldResolveOneWaySurface({
			isBottom: true,
			velY: -280,
			sourceFootY: 324,
			targetTopY: 320,
		}),
		false,
	);

	// Feet already deep inside tile must not snap upward
	assert.equal(
		shouldResolveOneWaySurface({
			isBottom: true,
			velY: 60,
			sourceFootY: 340,
			targetTopY: 320,
		}),
		false,
	);

	// Side or ceiling contact must pass through
	assert.equal(
		shouldResolveOneWaySurface({
			isBottom: false,
			velY: 0,
			sourceFootY: 320,
			targetTopY: 320,
		}),
		false,
	);
});

function mockCollision(opts: {
	tags: string[];
	isBottom: boolean;
	velY?: number;
	sourceY: number;
	targetY: number;
}): Collision {
	return {
		source: {
			pos: { y: opts.sourceY },
			vel: opts.velY !== undefined ? { y: opts.velY } : undefined,
		},
		target: {
			pos: { y: opts.targetY },
			is: (tag: string) => opts.tags.includes(tag),
		},
		isBottom: () => opts.isBottom,
	} as unknown as Collision;
}

test("shouldResolvePlatformCollision filters non-platforms, solid platforms, and one-way platforms", () => {
	assert.equal(
		shouldResolvePlatformCollision(
			mockCollision({ tags: ["enemy"], isBottom: true, velY: 100, sourceY: 320, targetY: 320 }),
		),
		false,
	);
	assert.equal(
		shouldResolvePlatformCollision(
			mockCollision({ tags: ["platform", "solidPlatform"], isBottom: false, velY: -100, sourceY: 340, targetY: 320 }),
		),
		true,
	);
	assert.equal(
		shouldResolvePlatformCollision(
			mockCollision({ tags: ["platform", "oneway"], isBottom: true, velY: 80, sourceY: 330, targetY: 320 }),
		),
		true,
	);
	assert.equal(
		shouldResolvePlatformCollision(
			mockCollision({ tags: ["platform", "oneway"], isBottom: true, velY: 80, sourceY: 331, targetY: 320 }),
		),
		false,
	);
	assert.equal(
		shouldResolvePlatformCollision(
			mockCollision({ tags: ["platform", "oneway"], isBottom: true, velY: -50, sourceY: 324, targetY: 320 }),
		),
		false,
	);
});

