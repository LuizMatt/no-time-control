import type { Collision, GameObj } from "kaplay";

export interface OneWayContactInput {
	isBottom: boolean;
	velY: number;
	sourceFootY: number;
	targetTopY: number;
}

const ONE_WAY_SNAP_TOLERANCE = 10;

/** Pure helper determining whether a one-way top contact should solidify. */
export function shouldResolveOneWaySurface(input: OneWayContactInput): boolean {
	if (!input.isBottom) return false;
	if (input.velY < 0) return false;
	return input.sourceFootY <= input.targetTopY + ONE_WAY_SNAP_TOLERANCE;
}

/** Shared platform collision filter for entities anchored at `"bot"` (player, enemies, boss). */
export function shouldResolvePlatformCollision(col: Collision): boolean {
	if (!col.target.is("platform")) {
		return false;
	}
	if (!col.target.is("oneway")) {
		return true;
	}
	const actor = col.source as GameObj & { vel?: { y: number } };
	return shouldResolveOneWaySurface({
		isBottom: col.isBottom(),
		velY: actor.vel?.y ?? 0,
		sourceFootY: col.source.pos.y,
		targetTopY: col.target.pos.y,
	});
}
