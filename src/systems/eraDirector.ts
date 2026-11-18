import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../core/constants";
import { k } from "../core/k";
import { state } from "../core/state";
import { ERAS } from "../data/eras";
import { showEraBanner } from "../ui/eraBanner";
import type { Era } from "../types";

const ALL_ERAS: readonly Era[] = ["past", "present", "future"];
let eraBag: Era[] = [];

function refillBag(): void {
	eraBag = [...ALL_ERAS];
	for (let i = eraBag.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const tmp = eraBag[i];
		eraBag[i] = eraBag[j];
		eraBag[j] = tmp;
	}
}

/** Draws the next era from the shuffle bag, updating state and history. */
export function pickEra(): Era {
	if (eraBag.length === 0) {
		refillBag();
	}
	const next = eraBag.pop() ?? "present";
	state.currentEra = next;
	state.eraHistory.push(next);
	return next;
}

/** Picks an era from the shuffle bag that is strictly different from currentEra. */
export function pickDifferentEra(currentEra: Era): Era {
	if (eraBag.length === 0 || (eraBag.length === 1 && eraBag[0] === currentEra)) {
		refillBag();
	}

	const idx = eraBag.findIndex((era) => era !== currentEra);
	if (idx !== -1) {
		const [picked] = eraBag.splice(idx, 1);
		return picked;
	}

	const alternatives = ALL_ERAS.filter((era) => era !== currentEra);
	return alternatives[Math.floor(Math.random() * alternatives.length)];
}

/** Applies the visual tint for the given era, shows the banner, and notifies listeners. */
export function applyEra(era: Era): void {
	const config = ERAS[era];

	k.add([
		k.rect(SCREEN_WIDTH, SCREEN_HEIGHT),
		k.pos(0, 0),
		k.color(...config.tint),
		k.fixed(),
		k.z(-100),
		"era-bg",
	]);

	showEraBanner(era);
	k.trigger("era:changed", "*", era);
}
