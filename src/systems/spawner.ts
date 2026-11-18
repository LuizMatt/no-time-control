import type { GameObj } from "kaplay";
import { k } from "../core/k";
import { state } from "../core/state";
import { ENEMIES } from "../data/enemies";
import { ERAS } from "../data/eras";
import { makeEnemy } from "../entities/enemy";
import type { Era, StageDef } from "../types";

/** Spawns stage enemies for the active era at or ahead of the current checkpoint. */
export function spawnStageEnemies(stageDef: StageDef, currentEra: Era): GameObj[] {
	const pool = ERAS[currentEra].enemyPool;
	const spawned: GameObj[] = [];

	for (const spawn of stageDef.spawns) {
		if (spawn.checkpointGroup < state.checkpointId) {
			continue;
		}

		const enemyId = pool[spawn.poolIndex];
		const enemyDef = ENEMIES[enemyId];
		if (!enemyDef) {
			continue;
		}

		const worldPos = k.vec2(
			spawn.tx * stageDef.tileWidth + stageDef.tileWidth / 2,
			spawn.ty * stageDef.tileHeight,
		);
		spawned.push(makeEnemy(enemyDef, worldPos));
	}

	return spawned;
}
