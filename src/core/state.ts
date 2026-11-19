import { PLAYER_MAX_HP } from "./constants";
import type { Era, WeaponId } from "../types";

export const state = {
	currentEra: "present" as Era,
	activeWeapon: "w1" as WeaponId,
	checkpointId: 0,
	hp: PLAYER_MAX_HP,
	maxHp: PLAYER_MAX_HP,
	special: 0,
	transformed: false,
	bossActive: false,
	bossDefeated: false,
	paused: false,
	deaths: 0,
	eraHistory: [] as Era[],
};

/** Resets all run state for a fresh game. */
export function resetRun(): void {
	state.currentEra = "present";
	state.activeWeapon = "w1";
	state.checkpointId = 0;
	state.hp = state.maxHp;
	state.special = 0;
	state.transformed = false;
	state.bossActive = false;
	state.bossDefeated = false;
	state.paused = false;
	state.deaths = 0;
	state.eraHistory = [];
}

/** Preserves checkpoint progress and special meter while switching to a new era on respawn. */
export function prepareCheckpointRespawn(nextEra: Era): void {
	state.currentEra = nextEra;
	state.hp = state.maxHp;
	state.transformed = false;
	state.bossActive = false;
	state.paused = false;
	state.deaths += 1;
	state.eraHistory.push(nextEra);
}
