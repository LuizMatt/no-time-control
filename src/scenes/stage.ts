import { fadeOutMusic, playMusic } from "../core/audio";
import { GRAVITY, SCREEN_HEIGHT, SCREEN_WIDTH } from "../core/constants";
import { k } from "../core/k";
import { prepareCheckpointRespawn, resetRun, state } from "../core/state";
import { BOSSES } from "../data/bosses";
import { ERAS } from "../data/eras";
import { STAGE_1 } from "../data/stages";
import { ERA_TILESETS } from "../data/tilesets";
import { makeBoss } from "../entities/boss";
import { makeCheckpoint } from "../entities/checkpoint";
import { makePlayer } from "../entities/player";
import { applyEra, pickDifferentEra, pickEra } from "../systems/eraDirector";
import { createEraParallax } from "../systems/parallax";
import { spawnStageEnemies } from "../systems/spawner";
import { initSpecialMeter } from "../systems/specialMeter";
import { buildStageEnvironment } from "../systems/stageBuilder";
import { showControlsHint } from "../ui/controlsHint";
import { createHud } from "../ui/hud";
import { initPauseMenu } from "../ui/pauseMenu";
import { createWeaponHud } from "../ui/weaponHud";

const BOSS_GATE_TX = 117;
const CAM_LOOKAHEAD_Y = 48;

function clamp(val: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, val));
}

/** Registers the main playable stage scene. */
export function registerStageScene(): void {
	k.scene("stage", () => {
		k.setGravity(GRAVITY);
		playMusic("bgm-main");
		applyEra(state.currentEra);

		const config = ERAS[state.currentEra];
		const { tileWidth, tileHeight } = STAGE_1;
		const { mapWidth, mapHeight, arenaTopRow, arenaFloorRow } = buildStageEnvironment(
			STAGE_1,
			state.currentEra,
		);
		createEraParallax(state.currentEra, mapHeight);
		const tileset = ERA_TILESETS[state.currentEra];

		for (const cp of STAGE_1.checkpoints) {
			makeCheckpoint(cp, tileWidth, tileHeight);
		}

		// Smooth fade-in from dark when entering the stage
		const entryFade = k.add([
			k.rect(SCREEN_WIDTH, SCREEN_HEIGHT),
			k.pos(0, 0),
			k.color(10, 8, 16),
			k.opacity(1),
			k.fixed(),
			k.z(200),
		]);
		let entryFadeElapsed = 0;
		const entryFadeDuration = 0.4;
		entryFade.onUpdate(() => {
			entryFadeElapsed += k.dt();
			entryFade.opacity = Math.max(0, 1 - entryFadeElapsed / entryFadeDuration);
			if (entryFadeElapsed >= entryFadeDuration) {
				entryFade.destroy();
			}
		});

		const activeCp =
			STAGE_1.checkpoints.find((c) => c.id === state.checkpointId) ??
			STAGE_1.checkpoints[0];
		const spawnPos = k.vec2(
			activeCp.tx * tileWidth + tileWidth / 2,
			activeCp.ty * tileHeight,
		);
		const player = makePlayer(spawnPos, mapHeight + 120);
		spawnStageEnemies(STAGE_1, state.currentEra);
		initSpecialMeter();
		createHud();
		createWeaponHud();
		showControlsHint();
		initPauseMenu();

		const minCamX = SCREEN_WIDTH / 2;
		const maxCamX = Math.max(minCamX, mapWidth - SCREEN_WIDTH / 2);
		const minCamY = SCREEN_HEIGHT / 2;
		const maxCamY = Math.max(minCamY, mapHeight - SCREEN_HEIGHT / 2);

		k.camPos(
			clamp(player.pos.x, minCamX, maxCamX),
			clamp(player.pos.y - CAM_LOOKAHEAD_Y, minCamY, maxCamY),
		);

		let bossSpawned = false;
		let victoryShown = false;

		const spawnBossArena = (): void => {
			bossSpawned = true;
			state.bossActive = true;
			state.checkpointId = Math.max(state.checkpointId, 2);

			// Lock the arena entrance behind the player
			const gateEntry = tileset.props.arenaGate;
			if (gateEntry !== undefined && typeof gateEntry !== "number") {
				let gateTopRow = arenaFloorRow;
				for (let row = arenaFloorRow - 1; row >= arenaTopRow; row--) {
					if (STAGE_1.map[row][BOSS_GATE_TX] === "#") break;
					gateTopRow = row;
				}
				const gateHeight = (arenaFloorRow - gateTopRow) * tileHeight;
				if (gateHeight > 0) {
					k.add([
						k.pos(BOSS_GATE_TX * tileWidth, gateTopRow * tileHeight),
						k.area({
							shape: new k.Rect(k.vec2(0, 0), tileWidth, gateHeight),
							collisionIgnore: ["platform", "hazard"],
						}),
						k.body({ isStatic: true }),
						"platform",
						"arenaGate",
					]);
					// Render stone wall above the 3-tile tall iron portcullis gate
					const gateRows = 3;
					for (let row = gateTopRow; row < arenaFloorRow - gateRows; row++) {
						const frame = tileset.center[row % tileset.center.length];
						k.add([
							k.sprite(tileset.sprite, { frame }),
							k.pos(BOSS_GATE_TX * tileWidth, row * tileHeight),
							k.z(6),
							"arenaGate",
						]);
					}
					k.add([
						k.sprite(gateEntry.sprite),
						k.pos(BOSS_GATE_TX * tileWidth + tileWidth / 2, arenaFloorRow * tileHeight),
						k.anchor("bot"),
						k.z(6),
						"arenaGate",
					]);
				}
			} else {
				for (let row = arenaFloorRow - 1; row >= arenaTopRow; row--) {
					if (STAGE_1.map[row][BOSS_GATE_TX] === "#") break;
					const doorEntry = tileset.props.door;
					const gateDoorFrame = typeof doorEntry === "number" ? doorEntry : 28;
					const frame =
						row === arenaFloorRow - 1
							? gateDoorFrame
							: tileset.center[row % tileset.center.length];
					k.add([
						k.sprite(tileset.sprite, { frame }),
						k.pos(BOSS_GATE_TX * tileWidth, row * tileHeight),
						k.area({ collisionIgnore: ["platform", "hazard"] }),
						k.body({ isStatic: true }),
						k.z(6),
						"platform",
						"arenaGate",
					]);
				}
			}

			const arenaBounds = {
				leftX: (BOSS_GATE_TX + 1) * tileWidth,
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

		k.on("player:hurt", "player", () => {
			k.shake(8);
		});

		k.on("transform:start", "player", () => {
			k.shake(8);
		});

		k.on("boss:defeated", "boss", () => {
			k.shake(12);
			fadeOutMusic(1.5);
		});

		k.on("boss:victory", "boss", () => {
			try {
				k.go("ending");
			} catch {
				showVictoryFallback();
			}
		});

		k.onUpdate(() => {
			if (state.paused) return;
			const cam = k.camPos();
			const targetX = clamp(player.pos.x, minCamX, maxCamX);
			const targetY = clamp(player.pos.y - CAM_LOOKAHEAD_Y, minCamY, maxCamY);
			const smooth = Math.min(1, k.dt() * 10);
			k.camPos(k.lerp(cam.x, targetX, smooth), k.lerp(cam.y, targetY, smooth));

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
			if (state.paused) return;
			const nextEra = pickDifferentEra(state.currentEra);
			prepareCheckpointRespawn(nextEra);
			k.go("stage");
		});
	});
}
