import type { GameObj, KEventController } from "kaplay";
import {
	getAudioSettings,
	playSfx,
	setMusicLevel,
	setSfxLevel,
	toggleMusicMute,
	toggleSfxMute,
} from "../core/audio";
import { KEYS, SCREEN_HEIGHT, SCREEN_WIDTH } from "../core/constants";
import { k } from "../core/k";
import { resetRun, state } from "../core/state";
import { pickEra } from "../systems/eraDirector";

// Official 16-color palette RGB triplets (matching intro/ending)
const COL_BG: [number, number, number] = [31, 14, 28]; // #1f0e1c
const COL_INNER: [number, number, number] = [62, 33, 55]; // #3e2137
const COL_BORDER: [number, number, number] = [88, 69, 99]; // #584563
const COL_CREAM: [number, number, number] = [245, 237, 186]; // #f5edba
const COL_RED: [number, number, number] = [157, 48, 59]; // #9d303b
const COL_CORAL: [number, number, number] = [210, 100, 113]; // #d26471
const COL_VIOLET: [number, number, number] = [112, 55, 127]; // #70377f
const COL_TEAL: [number, number, number] = [126, 196, 193]; // #7ec4c1

const VOLUME_STEP = 0.1;

const CONTROLS_LIST: ReadonlyArray<readonly [string, string]> = [
	["A / D", "Mover"],
	["ESPAÇO", "Pular"],
	["H", "Atacar"],
	["J", "Dash (Esquiva)"],
	["1 / 2 / 3", "Trocar Arma da Era"],
	["Q", "Transformar (Lobisomem)"],
	["R", "Trocar Era (Checkpoint)"],
	["ESC", "Abrir / Fechar Menu"],
];

/** Registers the top-right HUD menu button and the ESC pause/settings modal for the stage scene. */
export function initPauseMenu(): void {
	let isOpen = false;
	let pausedObjects: GameObj[] = [];
	let menuObjects: GameObj[] = [];
	let menuListeners: KEventController[] = [];

	const trackMenuObj = <T extends GameObj>(obj: T): T => {
		menuObjects.push(obj);
		return obj;
	};

	const trackListener = (ctrl: KEventController): void => {
		menuListeners.push(ctrl);
	};

	// Discreet top-right HUD button to open the menu with mouse or remind player of [ESC]
	const hudBtn = k.add([
		k.rect(112, 26, { radius: 4 }),
		k.pos(SCREEN_WIDTH - 20, 18),
		k.anchor("topright"),
		k.color(...COL_BG),
		k.outline(1, k.rgb(...COL_BORDER)),
		k.opacity(0.86),
		k.area(),
		k.fixed(),
		k.z(55),
		"pauseHudBtn",
	]);

	k.add([
		k.text("MENU \\[ESC\\]", { size: 11 }),
		k.pos(SCREEN_WIDTH - 76, 31),
		k.anchor("center"),
		k.color(...COL_CREAM),
		k.fixed(),
		k.z(56),
		"pauseHudBtn",
	]);

	hudBtn.onHoverUpdate(() => {
		hudBtn.color = k.rgb(...COL_INNER);
	});
	hudBtn.onHoverEnd(() => {
		hudBtn.color = k.rgb(...COL_BG);
	});

	const closeMenu = (): void => {
		if (!isOpen) return;
		isOpen = false;

		for (const ctrl of menuListeners) {
			ctrl.cancel();
		}
		menuListeners = [];

		for (const obj of menuObjects) {
			if (obj.exists()) {
				obj.destroy();
			}
		}
		menuObjects = [];

		for (const obj of pausedObjects) {
			if (obj.exists()) {
				obj.paused = false;
			}
		}
		pausedObjects = [];

		state.paused = false;
	};

	const addButton = (opts: {
		x: number;
		y: number;
		w: number;
		h: number;
		label: string;
		fontSize?: number;
		baseColor?: [number, number, number];
		hoverColor?: [number, number, number];
		outlineColor?: [number, number, number];
		onClick: () => void;
	}): { bg: GameObj; text: GameObj } => {
		const baseColor = opts.baseColor ?? COL_INNER;
		const hoverColor = opts.hoverColor ?? COL_VIOLET;
		const outlineColor = opts.outlineColor ?? COL_BORDER;

		const bg = trackMenuObj(
			k.add([
				k.rect(opts.w, opts.h, { radius: 4 }),
				k.pos(opts.x, opts.y),
				k.anchor("center"),
				k.color(...baseColor),
				k.outline(2, k.rgb(...outlineColor)),
				k.area(),
				k.fixed(),
				k.z(155),
				"pauseMenu",
			]),
		);

		const text = trackMenuObj(
			k.add([
				k.text(opts.label, { size: opts.fontSize ?? 13 }),
				k.pos(opts.x, opts.y),
				k.anchor("center"),
				k.color(...COL_CREAM),
				k.fixed(),
				k.z(156),
				"pauseMenu",
			]),
		);

		trackListener(
			bg.onHoverUpdate(() => {
				bg.color = k.rgb(...hoverColor);
			}),
		);
		trackListener(
			bg.onHoverEnd(() => {
				bg.color = k.rgb(...baseColor);
			}),
		);
		trackListener(bg.onClick(opts.onClick));

		return { bg, text };
	};

	const openMenu = (): void => {
		if (isOpen || state.bossDefeated) return;
		isOpen = true;
		state.paused = true;

		// Pause all gameplay objects cleanly
		pausedObjects = [];
		for (const obj of k.get("*")) {
			if (obj.is("pauseMenu") || obj.is("pauseHudBtn")) continue;
			if (!obj.paused) {
				obj.paused = true;
				pausedObjects.push(obj);
			}
		}

		// Backdrop
		trackMenuObj(
			k.add([
				k.rect(SCREEN_WIDTH, SCREEN_HEIGHT),
				k.pos(0, 0),
				k.color(8, 6, 14),
				k.opacity(0.74),
				k.fixed(),
				k.z(150),
				"pauseMenu",
			]),
		);

		const modalW = 700;
		const modalH = 428;
		const modalX = SCREEN_WIDTH / 2;
		const modalY = SCREEN_HEIGHT / 2;
		const leftX = modalX - modalW / 2;
		const topY = modalY - modalH / 2;

		// Outer & inner frames
		trackMenuObj(
			k.add([
				k.rect(modalW, modalH, { radius: 8 }),
				k.pos(modalX, modalY),
				k.anchor("center"),
				k.color(...COL_BG),
				k.outline(2, k.rgb(...COL_BORDER)),
				k.fixed(),
				k.z(151),
				"pauseMenu",
			]),
		);
		trackMenuObj(
			k.add([
				k.rect(modalW - 10, modalH - 10, { radius: 6 }),
				k.pos(modalX, modalY),
				k.anchor("center"),
				k.color(...COL_BG),
				k.outline(1, k.rgb(...COL_INNER)),
				k.fixed(),
				k.z(152),
				"pauseMenu",
			]),
		);

		// Header
		trackMenuObj(
			k.add([
				k.text("MENU DE PAUSA", { size: 22 }),
				k.pos(modalX, topY + 34),
				k.anchor("center"),
				k.color(...COL_CREAM),
				k.fixed(),
				k.z(153),
				"pauseMenu",
			]),
		);

		trackMenuObj(
			k.add([
				k.rect(modalW - 48, 2),
				k.pos(modalX, topY + 60),
				k.anchor("center"),
				k.color(...COL_INNER),
				k.fixed(),
				k.z(153),
				"pauseMenu",
			]),
		);

		// =====================================================
		// LEFT COLUMN — ÁUDIO
		// =====================================================
		const audioX = leftX + 34;
		const audioTopY = topY + 80;

		trackMenuObj(
			k.add([
				k.text("CONFIGURAÇÕES DE SOM", { size: 13 }),
				k.pos(audioX, audioTopY),
				k.color(...COL_CORAL),
				k.fixed(),
				k.z(153),
				"pauseMenu",
			]),
		);

		const barWidth = 140;

		const createAudioRow = (config: {
			title: string;
			y: number;
			getLevel: () => number;
			getMuted: () => boolean;
			onDecrease: () => void;
			onIncrease: () => void;
			onToggleMute: () => void;
		}): (() => void) => {
			trackMenuObj(
				k.add([
					k.text(config.title, { size: 13 }),
					k.pos(audioX, config.y),
					k.color(...COL_CREAM),
					k.fixed(),
					k.z(153),
					"pauseMenu",
				]),
			);

			const pctLabel = trackMenuObj(
				k.add([
					k.text("0%", { size: 12 }),
					k.pos(audioX + 266, config.y),
					k.anchor("topright"),
					k.color(...COL_TEAL),
					k.fixed(),
					k.z(153),
					"pauseMenu",
				]),
			);

			const ctrlY = config.y + 34;

			addButton({
				x: audioX + 16,
				y: ctrlY,
				w: 30,
				h: 28,
				label: "-",
				fontSize: 16,
				onClick: () => {
					config.onDecrease();
					refresh();
				},
			});

			trackMenuObj(
				k.add([
					k.rect(barWidth, 12, { radius: 3 }),
					k.pos(audioX + 40, ctrlY),
					k.anchor("left"),
					k.color(18, 12, 24),
					k.outline(1, k.rgb(...COL_BORDER)),
					k.fixed(),
					k.z(154),
					"pauseMenu",
				]),
			);

			const barFill = trackMenuObj(
				k.add([
					k.rect(barWidth, 12, { radius: 3 }),
					k.pos(audioX + 40, ctrlY),
					k.anchor("left"),
					k.color(...COL_TEAL),
					k.fixed(),
					k.z(155),
					"pauseMenu",
				]),
			);

			addButton({
				x: audioX + 40 + barWidth + 24,
				y: ctrlY,
				w: 30,
				h: 28,
				label: "+",
				fontSize: 16,
				onClick: () => {
					config.onIncrease();
					refresh();
				},
			});

			const muteBtn = addButton({
				x: audioX + 40 + barWidth + 78,
				y: ctrlY,
				w: 62,
				h: 28,
				label: "SOM",
				fontSize: 11,
				onClick: () => {
					config.onToggleMute();
					refresh();
				},
			});

			const refresh = (): void => {
				const muted = config.getMuted();
				const level = config.getLevel();
				const effective = muted ? 0 : level;
				barFill.width = Math.round(barWidth * effective);
				barFill.color = muted ? k.rgb(...COL_BORDER) : k.rgb(...COL_TEAL);
				pctLabel.text = muted ? "MUDO" : `${Math.round(level * 100)}%`;
				pctLabel.color = muted ? k.rgb(...COL_CORAL) : k.rgb(...COL_TEAL);
				muteBtn.text.text = muted ? "MUDO" : "ATIVO";
			};

			refresh();
			return refresh;
		};

		createAudioRow({
			title: "Música",
			y: audioTopY + 32,
			getLevel: () => getAudioSettings().musicLevel,
			getMuted: () => getAudioSettings().musicMuted,
			onDecrease: () => setMusicLevel(getAudioSettings().musicLevel - VOLUME_STEP),
			onIncrease: () => setMusicLevel(getAudioSettings().musicLevel + VOLUME_STEP),
			onToggleMute: () => {
				toggleMusicMute();
			},
		});

		createAudioRow({
			title: "Efeitos (SFX)",
			y: audioTopY + 114,
			getLevel: () => getAudioSettings().sfxLevel,
			getMuted: () => getAudioSettings().sfxMuted,
			onDecrease: () => {
				setSfxLevel(getAudioSettings().sfxLevel - VOLUME_STEP);
				playSfx("sfx-shot", { volume: 0.7 });
			},
			onIncrease: () => {
				setSfxLevel(getAudioSettings().sfxLevel + VOLUME_STEP);
				playSfx("sfx-shot", { volume: 0.7 });
			},
			onToggleMute: () => {
				const muted = toggleSfxMute();
				if (!muted) {
					playSfx("sfx-shot", { volume: 0.7 });
				}
			},
		});

		// Vertical divider between Audio and Controls
		trackMenuObj(
			k.add([
				k.rect(2, 240),
				k.pos(modalX + 12, topY + 202),
				k.anchor("center"),
				k.color(...COL_INNER),
				k.fixed(),
				k.z(153),
				"pauseMenu",
			]),
		);

		// =====================================================
		// RIGHT COLUMN — CONTROLES
		// =====================================================
		const ctrlColX = modalX + 36;
		const ctrlTopY = topY + 80;

		trackMenuObj(
			k.add([
				k.text("CONTROLES", { size: 13 }),
				k.pos(ctrlColX, ctrlTopY),
				k.color(...COL_CORAL),
				k.fixed(),
				k.z(153),
				"pauseMenu",
			]),
		);

		CONTROLS_LIST.forEach(([keyLabel, actionLabel], index) => {
			const rowY = ctrlTopY + 34 + index * 27;

			trackMenuObj(
				k.add([
					k.rect(86, 20, { radius: 3 }),
					k.pos(ctrlColX, rowY),
					k.anchor("left"),
					k.color(...COL_INNER),
					k.outline(1, k.rgb(...COL_BORDER)),
					k.fixed(),
					k.z(153),
					"pauseMenu",
				]),
			);
			trackMenuObj(
				k.add([
					k.text(keyLabel, { size: 10 }),
					k.pos(ctrlColX + 43, rowY),
					k.anchor("center"),
					k.color(...COL_CREAM),
					k.fixed(),
					k.z(154),
					"pauseMenu",
				]),
			);
			trackMenuObj(
				k.add([
					k.text(actionLabel, { size: 12 }),
					k.pos(ctrlColX + 98, rowY),
					k.anchor("left"),
					k.color(220, 214, 232),
					k.fixed(),
					k.z(154),
					"pauseMenu",
				]),
			);
		});

		// =====================================================
		// BOTTOM ACTION BUTTONS
		// =====================================================
		const btnRowY = topY + modalH - 46;

		addButton({
			x: modalX - 210,
			y: btnRowY,
			w: 186,
			h: 40,
			label: "CONTINUAR",
			fontSize: 13,
			baseColor: COL_RED,
			hoverColor: COL_VIOLET,
			outlineColor: COL_CORAL,
			onClick: closeMenu,
		});

		addButton({
			x: modalX,
			y: btnRowY,
			w: 186,
			h: 40,
			label: "REINICIAR FASE",
			fontSize: 13,
			baseColor: COL_INNER,
			hoverColor: COL_VIOLET,
			outlineColor: COL_BORDER,
			onClick: () => {
				closeMenu();
				resetRun();
				pickEra();
				k.go("stage");
			},
		});

		addButton({
			x: modalX + 210,
			y: btnRowY,
			w: 186,
			h: 40,
			label: "TELA INICIAL",
			fontSize: 13,
			baseColor: COL_INNER,
			hoverColor: COL_VIOLET,
			outlineColor: COL_BORDER,
			onClick: () => {
				closeMenu();
				resetRun();
				k.go("intro");
			},
		});
	};

	const toggleMenu = (): void => {
		if (isOpen) {
			closeMenu();
		} else {
			openMenu();
		}
	};

	hudBtn.onClick(toggleMenu);
	k.onKeyPress(KEYS.PAUSE, toggleMenu);
}
