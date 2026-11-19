import type { GameObj, KEventController } from "kaplay";
import { KEYS, SCREEN_WIDTH } from "../core/constants";
import { k } from "../core/k";
import { state } from "../core/state";

// Official 16-color palette RGB triplets
const COL_K: [number, number, number] = [31, 14, 28]; // #1f0e1c
const COL_S: [number, number, number] = [88, 69, 99]; // #584563
const COL_L: [number, number, number] = [140, 143, 174]; // #8c8fae
const COL_W: [number, number, number] = [245, 237, 186]; // #f5edba

const PANEL_W = 496;
const PANEL_H = 108;
const PANEL_OPACITY = 0.88;
/** Panel spans y = 116..224, clearing eraBanner (y <= 98) and staying above player / weapon HUD (y >= 429). */
const HINT_CENTER_Y = 170;
const HINT_DURATION = 6;
const FADE_DURATION = 0.5;

const KEY_W = 26;
const KEY_H = 28;
const KEY_GAP = 4;
const SPACE_W = KEY_W * 3 + KEY_GAP * 2; // 86px — aligns with [1][2][3]

interface HintItem {
	keys: { label: string; width: number }[];
	lines: string[];
	colX: number;
	rowY: number;
}

/** Shows a crisp, native pixel-style controls panel at the top of the screen on first stage entry. */
export function showControlsHint(): void {
	if (state.checkpointId !== 0 || state.deaths !== 0) return;

	const panelLeft = SCREEN_WIDTH / 2 - PANEL_W / 2;
	const panelTop = HINT_CENTER_Y - PANEL_H / 2;
	const row1Y = panelTop + 32;
	const row2Y = panelTop + 76;

	const nodes: { obj: GameObj; baseOpacity: number }[] = [];
	const track = <T extends GameObj>(obj: T, baseOpacity = 1): T => {
		nodes.push({ obj, baseOpacity });
		return obj;
	};

	const bg = track(
		k.add([
			k.rect(PANEL_W, PANEL_H, { radius: 6 }),
			k.pos(SCREEN_WIDTH / 2, HINT_CENTER_Y),
			k.anchor("center"),
			k.color(...COL_K),
			k.outline(2, k.rgb(...COL_S)),
			k.opacity(PANEL_OPACITY),
			k.fixed(),
			k.z(59),
		]),
		PANEL_OPACITY,
	);

	const drawKeycap = (leftX: number, centerY: number, width: number, label: string): void => {
		const centerX = leftX + width / 2;
		// Outer 3D keycap base (shadow/bevel)
		track(
			k.add([
				k.rect(width, KEY_H, { radius: 4 }),
				k.pos(centerX, centerY),
				k.anchor("center"),
				k.color(...COL_S),
				k.outline(2, k.rgb(...COL_K)),
				k.opacity(1),
				k.fixed(),
				k.z(60),
			]),
		);
		// Mid bevel highlight
		track(
			k.add([
				k.rect(width - 2, KEY_H - 5, { radius: 3 }),
				k.pos(centerX, centerY - 2),
				k.anchor("center"),
				k.color(...COL_L),
				k.opacity(1),
				k.fixed(),
				k.z(61),
			]),
		);
		// Cream keycap face
		track(
			k.add([
				k.rect(width - 4, KEY_H - 8, { radius: 2 }),
				k.pos(centerX, centerY - 3),
				k.anchor("center"),
				k.color(...COL_W),
				k.opacity(1),
				k.fixed(),
				k.z(62),
			]),
		);
		// Key label
		track(
			k.add([
				k.text(label, { size: label.length > 1 ? 11 : 13 }),
				k.pos(centerX, centerY - 3),
				k.anchor("center"),
				k.color(...COL_K),
				k.opacity(1),
				k.fixed(),
				k.z(63),
			]),
		);
	};

	const items: HintItem[] = [
		{
			keys: [
				{ label: "A", width: KEY_W },
				{ label: "D", width: KEY_W },
			],
			lines: ["MOVER"],
			colX: panelLeft + 20,
			rowY: row1Y,
		},
		{
			keys: [{ label: "Q", width: KEY_W }],
			lines: ["LOBO", "TRANSFORMAR"],
			colX: panelLeft + 156,
			rowY: row1Y,
		},
		{
			keys: [
				{ label: "1", width: KEY_W },
				{ label: "2", width: KEY_W },
				{ label: "3", width: KEY_W },
			],
			lines: ["ARMAS"],
			colX: panelLeft + 314,
			rowY: row1Y,
		},
		{
			keys: [{ label: "H", width: KEY_W }],
			lines: ["HIT", "ATACAR"],
			colX: panelLeft + 20,
			rowY: row2Y,
		},
		{
			keys: [{ label: "J", width: KEY_W }],
			lines: ["DASH", "AVANÇAR"],
			colX: panelLeft + 156,
			rowY: row2Y,
		},
		{
			keys: [{ label: "ESPAÇO", width: SPACE_W }],
			lines: ["PULAR"],
			colX: panelLeft + 314,
			rowY: row2Y,
		},
	];

	for (const item of items) {
		let x = item.colX;
		for (const key of item.keys) {
			drawKeycap(x, item.rowY, key.width, key.label);
			x += key.width + KEY_GAP;
		}
		const textX = x + 6;
		if (item.lines.length === 1) {
			track(
				k.add([
					k.text(item.lines[0], { size: 12 }),
					k.pos(textX, item.rowY - 1),
					k.anchor("left"),
					k.color(...COL_W),
					k.opacity(1),
					k.fixed(),
					k.z(62),
				]),
			);
		} else {
			track(
				k.add([
					k.text(item.lines[0], { size: 12 }),
					k.pos(textX, item.rowY - 8),
					k.anchor("left"),
					k.color(...COL_W),
					k.opacity(1),
					k.fixed(),
					k.z(62),
				]),
			);
			track(
				k.add([
					k.text(item.lines[1], { size: 10 }),
					k.pos(textX, item.rowY + 6),
					k.anchor("left"),
					k.color(...COL_L),
					k.opacity(1),
					k.fixed(),
					k.z(62),
				]),
			);
		}
	}

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

	bg.onDestroy(() => {
		cancelListeners();
		for (const { obj } of nodes) {
			if (obj !== bg && obj.exists()) obj.destroy();
		}
	});

	bg.onUpdate(() => {
		if (state.paused) return;
		elapsed += k.dt();
		if (!dismissed && elapsed >= HINT_DURATION) {
			dismissed = true;
			cancelListeners();
		}
		if (!dismissed) return;
		fade += k.dt();
		const alpha = Math.max(0, 1 - fade / FADE_DURATION);
		for (const { obj, baseOpacity } of nodes) {
			if (obj.exists()) obj.opacity = baseOpacity * alpha;
		}
		if (fade >= FADE_DURATION) bg.destroy();
	});
}
