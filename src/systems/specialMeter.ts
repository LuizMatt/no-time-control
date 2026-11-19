import { playSfx } from "../core/audio";
import {
	KEYS,
	SPECIAL_GAIN_HIT,
	SPECIAL_GAIN_KILL,
	SPECIAL_MAX,
	TRANSFORM_DURATION,
} from "../core/constants";
import { k } from "../core/k";
import { state } from "../core/state";

/** Initializes the special meter gain, Q transformation trigger, and active drain loop. */
export function initSpecialMeter(): void {
	k.on("combat:hit", "combatTarget", () => {
		if (!state.transformed) {
			state.special = Math.min(SPECIAL_MAX, state.special + SPECIAL_GAIN_HIT);
		}
	});

	k.on("combat:kill", "combatTarget", () => {
		if (!state.transformed) {
			state.special = Math.min(SPECIAL_MAX, state.special + SPECIAL_GAIN_KILL);
		}
	});

	k.onKeyPress(KEYS.TRANSFORM, () => {
		if (state.paused) return;
		if (!state.transformed && state.special >= SPECIAL_MAX) {
			state.transformed = true;
			playSfx("sfx-transform", { volume: 0.95 });
			k.trigger("transform:start", "player");
		}
	});

	k.onUpdate(() => {
		if (state.paused || !state.transformed) return;

		state.special -= (SPECIAL_MAX / TRANSFORM_DURATION) * k.dt();
		if (state.special <= 0) {
			state.special = 0;
			state.transformed = false;
			k.trigger("transform:end", "player");
		}
	});
}
