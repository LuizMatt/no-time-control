import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../core/constants";
import { k } from "../core/k";
import { resetRun, state } from "../core/state";
import { STORY } from "../data/story";
import { startDialogue } from "../ui/dialogue";

// Official 16-color palette RGB triplets
const COL_K: [number, number, number] = [31, 14, 28]; // #1f0e1c
const COL_P: [number, number, number] = [62, 33, 55]; // #3e2137
const COL_S: [number, number, number] = [88, 69, 99]; // #584563
const COL_W: [number, number, number] = [245, 237, 186]; // #f5edba
const COL_R: [number, number, number] = [157, 48, 59]; // #9d303b
const COL_C: [number, number, number] = [210, 100, 113]; // #d26471
const COL_V: [number, number, number] = [112, 55, 127]; // #70377f

/** Registers the ending scene with closing dialogue and run statistics summary. */
export function registerEndingScene(): void {
	k.scene("ending", () => {
		k.add([
			k.rect(SCREEN_WIDTH, SCREEN_HEIGHT),
			k.pos(0, 0),
			k.color(...COL_K),
			k.fixed(),
			k.z(0),
		]);

		k.add([
			k.sprite("intro-cutscene"),
			k.pos(0, 0),
			k.scale(3),
			k.fixed(),
			k.z(5),
		]);

		k.add([
			k.rect(SCREEN_WIDTH, 3),
			k.pos(0, 336),
			k.color(...COL_P),
			k.fixed(),
			k.z(20),
		]);

		const showRunSummary = (): void => {
			const boxX = 24;
			const boxY = 348;
			const boxW = SCREEN_WIDTH - 48;
			const boxH = 176;

			k.add([
				k.rect(boxW, boxH, { radius: 6 }),
				k.pos(boxX, boxY),
				k.color(...COL_K),
				k.outline(2, k.rgb(...COL_S)),
				k.fixed(),
				k.z(30),
			]);

			k.add([
				k.rect(boxW - 8, boxH - 8, { radius: 4 }),
				k.pos(boxX + 4, boxY + 4),
				k.color(...COL_K),
				k.outline(1, k.rgb(...COL_P)),
				k.fixed(),
				k.z(31),
			]);

			k.add([
				k.text("VOCÊ ASSUMIU O CONTROLE DO TEMPO!", { size: 22 }),
				k.pos(SCREEN_WIDTH / 2, boxY + 36),
				k.anchor("center"),
				k.color(...COL_W),
				k.fixed(),
				k.z(32),
			]);

			k.add([
				k.text(`Mortes / Saltos Temporais: ${state.deaths}`, { size: 16 }),
				k.pos(SCREEN_WIDTH / 2, boxY + 78),
				k.anchor("center"),
				k.color(...COL_C),
				k.fixed(),
				k.z(32),
			]);

			const replayBtn = k.add([
				k.rect(260, 40, { radius: 4 }),
				k.pos(SCREEN_WIDTH / 2, boxY + 130),
				k.anchor("center"),
				k.color(...COL_R),
				k.outline(2, k.rgb(...COL_C)),
				k.area(),
				k.fixed(),
				k.z(33),
				"replayButton",
			]);

			k.add([
				k.text("JOGAR NOVAMENTE [ESPAÇO]", { size: 14 }),
				k.pos(SCREEN_WIDTH / 2, boxY + 130),
				k.anchor("center"),
				k.color(...COL_W),
				k.fixed(),
				k.z(34),
			]);

			let restarting = false;
			let guardTimer = 0.15;
			k.onUpdate(() => {
				if (guardTimer > 0) {
					guardTimer = Math.max(0, guardTimer - k.dt());
				}
			});

			const triggerReplay = (): void => {
				if (restarting || guardTimer > 0) return;
				restarting = true;
				resetRun();
				k.go("intro");
			};

			replayBtn.onHoverUpdate(() => {
				replayBtn.color = k.rgb(...COL_V);
			});
			replayBtn.onHoverEnd(() => {
				replayBtn.color = k.rgb(...COL_R);
			});
			k.onClick("replayButton", triggerReplay);
			k.onKeyPress("space", triggerReplay);
			k.onKeyPress("enter", triggerReplay);
		};

		startDialogue(STORY.ending, showRunSummary);
	});
}
