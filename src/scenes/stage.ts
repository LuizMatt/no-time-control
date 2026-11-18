import { GRAVITY, SCREEN_HEIGHT, SCREEN_WIDTH } from "../core/constants";
import { k } from "../core/k";
import { prepareCheckpointRespawn, resetRun, state } from "../core/state";
import { BOSSES } from "../data/bosses";
import { ERAS } from "../data/eras";
import { STAGE_1 } from "../data/stages";
import { makeBoss } from "../entities/boss";
import { makeCheckpoint } from "../entities/checkpoint";
import { makePlayer } from "../entities/player";
import { applyEra, pickDifferentEra, pickEra } from "../systems/eraDirector";
import { spawnStageEnemies } from "../systems/spawner";
import { initSpecialMeter } from "../systems/specialMeter";
import { createHud } from "../ui/hud";

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
		spawnStageEnemies(STAGE_1, state.currentEra);
		initSpecialMeter();
		createHud();

		const mapWidth = STAGE_1.map[0].length * tileWidth;
		const mapHeight = STAGE_1.map.length * tileHeight;
		const minCamX = SCREEN_WIDTH / 2;
		const maxCamX = Math.max(minCamX, mapWidth - SCREEN_WIDTH / 2);
		const clampCamX = (x: number): number => Math.max(minCamX, Math.min(maxCamX, x));

		k.camPos(clampCamX(player.pos.x), mapHeight / 2);

		let bossSpawned = false;
		let victoryShown = false;

		const spawnBossArena = (): void => {
			bossSpawned = true;
			state.bossActive = true;
			state.checkpointId = Math.max(state.checkpointId, 3);

			// Lock the arena entrance behind the player
			k.add([
				k.rect(tileWidth, 14 * tileHeight),
				k.pos(103 * tileWidth, tileHeight),
				k.color(...config.platformColor),
				k.outline(2, k.rgb(...config.accentColor)),
				k.area(),
				k.body({ isStatic: true }),
				k.z(6),
				"platform",
				"arenaGate",
			]);

			const arenaBounds = {
				leftX: 104 * tileWidth,
				rightX: (STAGE_1.map[0].length - 1) * tileWidth,
				floorY: STAGE_1.bossSpawn.ty * tileHeight,
			};
			const bossDef = BOSSES[config.bossId];
			const bossPos = k.vec2(
				STAGE_1.bossSpawn.tx * tileWidth + tileWidth / 2,
				STAGE_1.bossSpawn.ty * tileHeight,
			);
			makeBoss(bossDef, bossPos, arenaBounds);
		};

		const showVictoryFallback = (): void => {
			if (victoryShown) return;
			victoryShown = true;

			k.add([
				k.rect(520, 140, { radius: 8 }),
				k.pos(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2),
				k.anchor("center"),
				k.color(10, 14, 24),
				k.outline(3, k.rgb(...config.accentColor)),
				k.opacity(0.92),
				k.fixed(),
				k.z(90),
			]);
			k.add([
				k.text("BOSS DERROTADO!", { size: 28 }),
				k.pos(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 24),
				k.anchor("center"),
				k.color(...config.accentColor),
				k.fixed(),
				k.z(91),
			]);
			k.add([
				k.text("Pressione [ESPAÇO] para jogar novamente", { size: 15 }),
				k.pos(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 24),
				k.anchor("center"),
				k.color(230, 236, 246),
				k.fixed(),
				k.z(91),
			]);

			k.onKeyPress("space", () => {
				resetRun();
				pickEra();
				k.go("stage");
			});
		};

		k.on("boss:victory", "boss", () => {
			try {
				k.go("ending");
			} catch {
				showVictoryFallback();
			}
		});

		k.onUpdate(() => {
			const cam = k.camPos();
			const targetX = clampCamX(player.pos.x);
			const nextX = k.lerp(cam.x, targetX, Math.min(1, k.dt() * 10));
			k.camPos(nextX, mapHeight / 2);

			if (
				!bossSpawned &&
				!state.bossActive &&
				!state.bossDefeated &&
				player.exists() &&
				player.pos.x >= STAGE_1.bossSpawn.triggerTx * tileWidth
			) {
				spawnBossArena();
			}
		});

		k.onKeyPress("r", () => {
			const nextEra = pickDifferentEra(state.currentEra);
			prepareCheckpointRespawn(nextEra);
			k.go("stage");
		});
	});
}
