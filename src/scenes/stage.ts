import { GRAVITY, SCREEN_HEIGHT, SCREEN_WIDTH } from "../core/constants";
import { k } from "../core/k";
import { prepareCheckpointRespawn, state } from "../core/state";
import { ERAS } from "../data/eras";
import { STAGE_1 } from "../data/stages";
import { makeCheckpoint } from "../entities/checkpoint";
import { makePlayer } from "../entities/player";
import { applyEra, pickDifferentEra } from "../systems/eraDirector";

/** Registers the main playable stage scene. */
export function registerStageScene(): void {
	k.scene("stage", () => {
		k.setGravity(GRAVITY);
		applyEra(state.currentEra);

		const config = ERAS[state.currentEra];
		const { tileWidth, tileHeight } = STAGE_1;

		k.addLevel(STAGE_1.map, {
			tileWidth,
			tileHeight,
			tiles: {
				"#": () => [
					k.rect(tileWidth, tileHeight),
					k.color(...config.platformColor),
					k.area(),
					k.body({ isStatic: true }),
					k.offscreen({ hide: true }),
					"platform",
				],
				"^": () => [
					k.polygon([
						k.vec2(4, tileHeight),
						k.vec2(tileWidth / 2, tileHeight - 16),
						k.vec2(tileWidth - 4, tileHeight),
					]),
					k.color(220, 70, 70),
					k.area({ shape: new k.Rect(k.vec2(6, tileHeight - 14), tileWidth - 12, 14) }),
					k.offscreen({ hide: true }),
					"hazard",
				],
			},
		});

		for (const cp of STAGE_1.checkpoints) {
			makeCheckpoint(cp, tileWidth, tileHeight);
		}

		const activeCp =
			STAGE_1.checkpoints.find((c) => c.id === state.checkpointId) ??
			STAGE_1.checkpoints[0];
		const spawnPos = k.vec2(
			activeCp.tx * tileWidth + tileWidth / 2,
			activeCp.ty * tileHeight,
		);
		const player = makePlayer(spawnPos);

		const mapWidth = STAGE_1.map[0].length * tileWidth;
		const mapHeight = STAGE_1.map.length * tileHeight;
		const minCamX = SCREEN_WIDTH / 2;
		const maxCamX = Math.max(minCamX, mapWidth - SCREEN_WIDTH / 2);
		const clampCamX = (x: number): number => Math.max(minCamX, Math.min(maxCamX, x));

		k.camPos(clampCamX(player.pos.x), mapHeight / 2);

		const formatHudText = (): string =>
			`Era: ${config.label}  |  HP: ${state.hp}/${state.maxHp}  |  CP: ${state.checkpointId}  |  Mortes: ${state.deaths}  |  \\[A/D\\] Mover  \\[Espaço\\] Pular  \\[J\\] Dash  \\[R\\] Respawn`;

		const debugHud = k.add([
			k.text(formatHudText(), { size: 13 }),
			k.pos(SCREEN_WIDTH / 2, SCREEN_HEIGHT - 22),
			k.anchor("center"),
			k.color(210, 215, 225),
			k.fixed(),
			k.z(50),
		]);

		k.onUpdate(() => {
			const cam = k.camPos();
			const targetX = clampCamX(player.pos.x);
			const nextX = k.lerp(cam.x, targetX, Math.min(1, k.dt() * 10));
			k.camPos(nextX, mapHeight / 2);

			const nextText = formatHudText();
			if (debugHud.text !== nextText) {
				debugHud.text = nextText;
			}
		});

		k.onKeyPress("r", () => {
			const nextEra = pickDifferentEra(state.currentEra);
			prepareCheckpointRespawn(nextEra);
			k.go("stage");
		});
	});
}
