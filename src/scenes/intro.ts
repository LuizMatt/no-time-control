import type { GameObj, KEventController } from "kaplay";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../core/constants";
import { k } from "../core/k";
import { resetRun } from "../core/state";
import { STORY } from "../data/story";
import { pickEra } from "../systems/eraDirector";
import { startDialogue } from "../ui/dialogue";

// Official 16-color palette RGB triplets
const COL_K: [number, number, number] = [31, 14, 28]; // #1f0e1c
const COL_P: [number, number, number] = [62, 33, 55]; // #3e2137
const COL_S: [number, number, number] = [88, 69, 99]; // #584563
const COL_W: [number, number, number] = [245, 237, 186]; // #f5edba
const COL_R: [number, number, number] = [157, 48, 59]; // #9d303b
const COL_C: [number, number, number] = [210, 100, 113]; // #d26471
const COL_V: [number, number, number] = [112, 55, 127]; // #70377f

/** Registers the opening scene with a Play button followed by the Jubileu & Mago do Tempo cutscene. */
export function registerIntroScene(): void {
	k.scene("intro", () => {
		// Full-screen dark background
		k.add([
			k.rect(SCREEN_WIDTH, SCREEN_HEIGHT),
			k.pos(0, 0),
			k.color(...COL_K),
			k.fixed(),
			k.z(0),
		]);

		// Top 16-color pixel-art cutscene panorama (320x112 scaled 3x -> 960x336)
		k.add([
			k.sprite("intro-cutscene"),
			k.pos(0, 0),
			k.scale(3),
			k.fixed(),
			k.z(5),
		]);

		// Subtle floating arcane motes over the hourglass and Mago do Tempo
		for (let i = 0; i < 14; i++) {
			const baseX = 180 + ((i * 53) % 660);
			const baseY = 54 + ((i * 29) % 240);
			const phase = i * 0.9;
			const isBright = i % 3 === 0;
			const mote = k.add([
				k.rect(3, 3),
				k.pos(baseX, baseY),
				k.color(...(isBright ? COL_W : COL_V)),
				k.opacity(0.65),
				k.fixed(),
				k.z(10),
			]);
			mote.onUpdate(() => {
				const t = k.time() * 1.6 + phase;
				mote.pos.y = baseY + Math.sin(t) * 6;
				mote.opacity = 0.35 + (Math.sin(t * 1.4) * 0.5 + 0.5) * 0.55;
			});
		}

		// Stone divider line at y = 336
		k.add([
			k.rect(SCREEN_WIDTH, 3),
			k.pos(0, 336),
			k.color(...COL_P),
			k.fixed(),
			k.z(20),
		]);

		// Title / Play overlay in the bottom area before the dialogue starts
		const playUi: GameObj[] = [];
		const playListeners: KEventController[] = [];
		let cutsceneStarted = false;

		const trackPlayUi = <T extends GameObj>(obj: T): T => {
			playUi.push(obj);
			return obj;
		};

		const boxX = 24;
		const boxY = 348;
		const boxW = SCREEN_WIDTH - 48;
		const boxH = 176;

		trackPlayUi(
			k.add([
				k.rect(boxW, boxH, { radius: 6 }),
				k.pos(boxX, boxY),
				k.color(...COL_K),
				k.outline(2, k.rgb(...COL_S)),
				k.fixed(),
				k.z(30),
			]),
		);

		trackPlayUi(
			k.add([
				k.rect(boxW - 8, boxH - 8, { radius: 4 }),
				k.pos(boxX + 4, boxY + 4),
				k.color(...COL_K),
				k.outline(1, k.rgb(...COL_P)),
				k.fixed(),
				k.z(31),
			]),
		);

		trackPlayUi(
			k.add([
				k.text("NO TIME CONTROL", { size: 30 }),
				k.pos(SCREEN_WIDTH / 2, boxY + 44),
				k.anchor("center"),
				k.color(...COL_W),
				k.fixed(),
				k.z(32),
			]),
		);

		const btnW = 220;
		const btnH = 44;
		const btnX = SCREEN_WIDTH / 2;
		const btnY = boxY + 104;

		const playBtn = trackPlayUi(
			k.add([
				k.rect(btnW, btnH, { radius: 4 }),
				k.pos(btnX, btnY),
				k.anchor("center"),
				k.color(...COL_R),
				k.outline(2, k.rgb(...COL_C)),
				k.area(),
				k.fixed(),
				k.z(33),
				"playButton",
			]),
		);

		trackPlayUi(
			k.add([
				k.text("PLAY", { size: 20 }),
				k.pos(btnX, btnY),
				k.anchor("center"),
				k.color(...COL_W),
				k.fixed(),
				k.z(34),
			]),
		);

		trackPlayUi(
			k.add([
				k.text("Clique em PLAY ou pressione [ESPAÇO] para iniciar", {
					size: 12,
				}),
				k.pos(SCREEN_WIDTH / 2, boxY + 156),
				k.anchor("center"),
				k.color(...COL_S),
				k.fixed(),
				k.z(32),
			]),
		);

		const beginCutscene = (): void => {
			if (cutsceneStarted) return;
			cutsceneStarted = true;

			for (const ctrl of playListeners) {
				ctrl.cancel();
			}
			for (const obj of playUi) {
				if (obj.exists()) obj.destroy();
			}

			startDialogue(STORY.intro, () => {
				const fadeOverlay = k.add([
					k.rect(SCREEN_WIDTH, SCREEN_HEIGHT),
					k.pos(0, 0),
					k.color(10, 8, 16),
					k.opacity(0),
					k.fixed(),
					k.z(200),
				]);

				const fadeDuration = 0.85;
				const holdDuration = 0.15;
				let elapsed = 0;
				let transitioned = false;

				fadeOverlay.onUpdate(() => {
					if (transitioned) return;
					elapsed += k.dt();
					fadeOverlay.opacity = Math.min(1, elapsed / fadeDuration);
					if (elapsed >= fadeDuration + holdDuration) {
						transitioned = true;
						resetRun();
						pickEra();
						k.go("stage");
					}
				});
			});
		};

		playListeners.push(
			playBtn.onHoverUpdate(() => {
				playBtn.color = k.rgb(...COL_V);
			}),
		);
		playListeners.push(
			playBtn.onHoverEnd(() => {
				playBtn.color = k.rgb(...COL_R);
			}),
		);
		playListeners.push(k.onClick("playButton", beginCutscene));
		playListeners.push(k.onKeyPress("space", beginCutscene));
		playListeners.push(k.onKeyPress("enter", beginCutscene));
	});
}
