import type { KEventController } from "kaplay";
import { KEYS, SCREEN_WIDTH } from "../core/constants";
import { k } from "../core/k";
import { state } from "../core/state";

/** Sprite is 468x152 (CONTROLS_DOWNSCALE = 2 in scripts/build-ui-assets.mjs); 1:1 scale sits cleanly in the upper-center (~49% screen width). */
const CONTROLS_SCALE = 1;
const HINT_CENTER_Y = 150;
const HINT_DURATION = 6;
const FADE_DURATION = 0.5;

/** Shows the controls image at the top of the screen on the first entry into the stage. */
export function showControlsHint(): void {
	if (state.checkpointId !== 0 || state.deaths !== 0) return;

	const hint = k.add([
		k.sprite("ui-controls"),
		k.pos(SCREEN_WIDTH / 2, HINT_CENTER_Y),
		k.anchor("center"),
		k.scale(CONTROLS_SCALE),
		k.opacity(1),
		k.fixed(),
		k.z(60),
	]);

	let elapsed = 0;
	let dismissed = false;
	let fade = 0;
	const listeners: KEventController[] = [];

	const cancelListeners = (): void => {
		for (const ctrl of listeners) {
			ctrl.cancel();
		}
		listeners.length = 0;
	};

	const dismiss = (): void => {
		if (state.paused || dismissed) return;
		dismissed = true;
		cancelListeners();
	};

	for (const key of [KEYS.LEFT, KEYS.RIGHT, KEYS.JUMP, KEYS.ATTACK, KEYS.DASH]) {
		listeners.push(k.onKeyPress(key, dismiss));
	}

	hint.onDestroy(cancelListeners);

	hint.onUpdate(() => {
		if (state.paused) return;
		elapsed += k.dt();
		if (!dismissed && elapsed >= HINT_DURATION) {
			dismissed = true;
			cancelListeners();
		}
		if (!dismissed) return;
		fade += k.dt();
		hint.opacity = Math.max(0, 1 - fade / FADE_DURATION);
		if (fade >= FADE_DURATION) hint.destroy();
	});
}
