import type { KEventController } from "kaplay";
import { KEYS, SCREEN_WIDTH } from "../core/constants";
import { k } from "../core/k";
import { state } from "../core/state";

/** Sprite is 468x152 (CONTROLS_DOWNSCALE = 2 in scripts/build-ui-assets.mjs); 1:1 scale sits cleanly in the upper-center (~49% screen width). */
const CONTROLS_SCALE = 1;
const CONTROLS_WIDTH = 468;
const CONTROLS_HEIGHT = 152;
const PANEL_PAD_X = 24;
const PANEL_PAD_Y = 20;
const PANEL_OPACITY = 0.84;
/** Panel spans y = 109..281, clearing eraBanner (y <= 98) and staying above player / weapon HUD (y >= 429). */
const HINT_CENTER_Y = 195;
const HINT_DURATION = 6;
const FADE_DURATION = 0.5;

/** Shows the controls image at the top of the screen on the first entry into the stage. */
export function showControlsHint(): void {
	if (state.checkpointId !== 0 || state.deaths !== 0) return;

	const bg = k.add([
		k.rect(CONTROLS_WIDTH + PANEL_PAD_X, CONTROLS_HEIGHT + PANEL_PAD_Y, { radius: 6 }),
		k.pos(SCREEN_WIDTH / 2, HINT_CENTER_Y),
		k.anchor("center"),
		k.color(31, 14, 28),
		k.outline(2, k.rgb(88, 69, 99)),
		k.opacity(PANEL_OPACITY),
		k.fixed(),
		k.z(59),
	]);

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

	hint.onDestroy(() => {
		cancelListeners();
		if (bg.exists()) bg.destroy();
	});

	hint.onUpdate(() => {
		if (state.paused) return;
		elapsed += k.dt();
		if (!dismissed && elapsed >= HINT_DURATION) {
			dismissed = true;
			cancelListeners();
		}
		if (!dismissed) return;
		fade += k.dt();
		const alpha = Math.max(0, 1 - fade / FADE_DURATION);
		hint.opacity = alpha;
		bg.opacity = PANEL_OPACITY * alpha;
		if (fade >= FADE_DURATION) hint.destroy();
	});
}
