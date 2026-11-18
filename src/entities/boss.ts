import type { GameObj, Vec2 } from "kaplay";
import { k } from "../core/k";
import { state } from "../core/state";
import type { BossDef } from "../types";
import { spawnEnemyProjectile } from "./projectile";

export interface ArenaBounds {
	leftX: number;
	rightX: number;
	floorY: number;
}

type BossPhase = "move" | "telegraph" | "attack" | "recover" | "teleportOut" | "defeat";

const TELEGRAPH_DURATION = 0.45;
const LASER_CHARGE_DURATION = 0.5;
const TELEPORT_FADE_DURATION = 0.18;
const DEFEAT_DURATION = 1.5;

const CHARGE_SPEED_MULT = 2.6;
const CHARGE_DURATION = 0.7;
const CHARGE_JUMP_FORCE = 460;

const BOSS_PROJECTILE_SPEED = 410;
const BOSS_PROJECTILE_RANGE = 920;
const LASER_SPEED = 860;
const LASER_RANGE = 1100;

/** Instantiates the adaptive Era Boss entity with telegraphed attack patterns and defeat sequence. */
export function makeBoss(def: BossDef, spawnPos: Vec2, arenaBounds: ArenaBounds): GameObj {
	let dir: 1 | -1 = -1;
	let phase: BossPhase = "move";
	let phaseTimer = 0;
	let attackTimer = 1.0;
	let flashTimer = 0;
	let isDead = false;

	// Pattern-specific state
	let chargeDir: 1 | -1 = -1;
	let barrageMode: "burst" | "fan" = "burst";
	let burstShotsLeft = 0;
	let burstShotTimer = 0;
	let teleportTarget: Vec2 | null = null;
	let aimDir: Vec2 = k.vec2(-1, 0);
	let aimLine: GameObj | null = null;

	const minX = arenaBounds.leftX + def.width / 2 + 8;
	const maxX = arenaBounds.rightX - def.width / 2 - 8;

	const teleportSpots: Vec2[] = [
		k.vec2(arenaBounds.leftX + 76, arenaBounds.floorY),
		k.vec2(arenaBounds.rightX - 76, arenaBounds.floorY),
		k.vec2(arenaBounds.leftX + 270, arenaBounds.floorY - 128),
		k.vec2(arenaBounds.rightX - 180, arenaBounds.floorY - 128),
	];

	const clearAimLine = (): void => {
		if (aimLine && aimLine.exists()) {
			aimLine.destroy();
		}
		aimLine = null;
	};

	const emitBossUpdated = (target: GameObj): void => {
		target.trigger("boss:updated", {
			hp: target.hp,
			maxHp: target.maxHp,
			name: def.name,
			era: def.era,
		});
	};

	const boss = k.add([
		k.rect(def.width, def.height, { radius: 4 }),
		k.pos(spawnPos),
		k.anchor("bot"),
		k.area(),
		k.body(),
		k.scale(1),
		k.color(...def.color),
		k.opacity(1),
		k.z(9),
		"boss",
		"combatTarget",
		{
			era: def.era,
			hp: def.hp,
			maxHp: def.hp,
			bossId: def.id,
			onDamaged(_damage: number, effective: boolean): void {
				if (isDead) return;
				if (effective) {
					flashTimer = 0.1;
					boss.color = k.rgb(255, 255, 255);
				}
				emitBossUpdated(boss);

				if (boss.hp <= 0) {
					isDead = true;
					phase = "defeat";
					phaseTimer = DEFEAT_DURATION;
					clearAimLine();
					state.bossDefeated = true;
					state.bossActive = false;
					boss.trigger("combat:kill", boss);
					boss.trigger("boss:defeated", boss);
				}
			},
		},
	]);

	boss.onBeforePhysicsResolve((col) => {
		if (!col.target.is("platform")) {
			col.preventResolution();
		}
	});

	const damagePlayerOnTouch = (playerObj: GameObj): void => {
		if (isDead) return;
		const target = playerObj as GameObj & { takeDamage?: (amount: number) => void };
		target.takeDamage?.(def.contactDamage);
	};

	boss.onCollide("player", damagePlayerOnTouch);
	boss.onCollideUpdate((obj) => {
		if (obj.is("player")) {
			damagePlayerOnTouch(obj);
		}
	});

	const getPlayer = (): GameObj | null => {
		const players = k.get("player");
		return players.length > 0 ? players[0] : null;
	};

	const clampX = (): void => {
		if (boss.pos.x < minX) boss.pos.x = minX;
		if (boss.pos.x > maxX) boss.pos.x = maxX;
	};

	const facePlayer = (player: GameObj | null): void => {
		if (!player) return;
		const dx = player.pos.x - boss.pos.x;
		if (Math.abs(dx) > 6) {
			dir = dx > 0 ? 1 : -1;
		}
	};

	const fireBurstShot = (slotIndex: number): void => {
		const offsetsY = [-18, -38, -58];
		const offsetY = offsetsY[slotIndex % offsetsY.length];
		spawnEnemyProjectile({
			pos: k.vec2(boss.pos.x + dir * (def.width / 2 + 10), boss.pos.y + offsetY),
			dir: k.vec2(dir, 0),
			speed: BOSS_PROJECTILE_SPEED,
			range: BOSS_PROJECTILE_RANGE,
			damage: def.contactDamage,
			color: def.color,
		});
	};

	const fireFanShot = (player: GameObj | null): void => {
		const origin = k.vec2(boss.pos.x + dir * (def.width / 2 + 10), boss.pos.y - def.height * 0.55);
		const targetPos = player
			? k.vec2(player.pos.x, player.pos.y - 22)
			: k.vec2(origin.x + dir * 200, origin.y);
		const baseAngle = Math.atan2(targetPos.y - origin.y, targetPos.x - origin.x);
		const spreadAngles = [-0.26, 0, 0.26];

		for (const offset of spreadAngles) {
			const angle = baseAngle + offset;
			spawnEnemyProjectile({
				pos: origin,
				dir: k.vec2(Math.cos(angle), Math.sin(angle)),
				speed: BOSS_PROJECTILE_SPEED * 0.92,
				range: BOSS_PROJECTILE_RANGE,
				damage: def.contactDamage,
				color: def.color,
			});
		}
	};

	const pickTeleportSpot = (player: GameObj | null): Vec2 => {
		const candidates = teleportSpots.filter((spot) => spot.dist(boss.pos) > 80);
		if (candidates.length === 0) return teleportSpots[0];
		if (!player) return candidates[Math.floor(Math.random() * candidates.length)];

		// Prefer spots with good distance from the player so attacks are readable
		const sorted = [...candidates].sort((a, b) => b.dist(player.pos) - a.dist(player.pos));
		const topCount = Math.min(2, sorted.length);
		return sorted[Math.floor(Math.random() * topCount)];
	};

	const startAimLine = (player: GameObj | null): void => {
		clearAimLine();
		const origin = k.vec2(boss.pos.x, boss.pos.y - def.height * 0.55);
		const targetPos = player
			? k.vec2(player.pos.x, player.pos.y - 22)
			: k.vec2(origin.x + dir * 300, origin.y);
		const delta = targetPos.sub(origin);
		aimDir = delta.len() > 0 ? delta.unit() : k.vec2(dir, 0);
		const angleDeg = (Math.atan2(aimDir.y, aimDir.x) * 180) / Math.PI;

		aimLine = k.add([
			k.rect(960, 2),
			k.pos(origin),
			k.anchor("left"),
			k.rotate(angleDeg),
			k.color(255, 95, 135),
			k.opacity(0.85),
			k.z(14),
		]);
	};

	const updateChargeMelee = (dt: number, player: GameObj | null): void => {
		if (phase === "move") {
			facePlayer(player);
			boss.move(dir * def.speed, 0);
			clampX();

			attackTimer -= dt;
			if (attackTimer <= 0) {
				chargeDir = dir;
				phase = "telegraph";
				phaseTimer = TELEGRAPH_DURATION;
			}
			return;
		}

		if (phase === "telegraph") {
			const blink = Math.floor(k.time() * 18) % 2 === 0;
			boss.color = blink ? k.rgb(255, 220, 75) : k.rgb(255, 115, 45);
			phaseTimer -= dt;
			if (phaseTimer <= 0) {
				boss.color = k.rgb(...def.color);
				phase = "attack";
				phaseTimer = CHARGE_DURATION;
			}
			return;
		}

		if (phase === "attack") {
			boss.move(chargeDir * def.speed * CHARGE_SPEED_MULT, 0);
			const hitWall =
				(chargeDir === -1 && boss.pos.x <= minX) ||
				(chargeDir === 1 && boss.pos.x >= maxX);
			clampX();

			phaseTimer -= dt;
			if (hitWall || phaseTimer <= 0) {
				if (boss.isGrounded()) {
					boss.jump(CHARGE_JUMP_FORCE);
				}
				phase = "recover";
				phaseTimer = 0.55;
			}
			return;
		}

		if (phase === "recover") {
			phaseTimer -= dt;
			if (phaseTimer <= 0 && boss.isGrounded()) {
				phase = "move";
				attackTimer = def.attackCooldown;
			}
		}
	};

	const updateProjectileBarrage = (dt: number, player: GameObj | null): void => {
		if (phase === "move") {
			facePlayer(player);
			if (player) {
				const dist = Math.abs(player.pos.x - boss.pos.x);
				if (dist < 180) {
					boss.move(-dir * def.speed, 0);
				} else if (dist > 310) {
					boss.move(dir * def.speed, 0);
				}
				clampX();
			}

			attackTimer -= dt;
			if (attackTimer <= 0) {
				phase = "telegraph";
				phaseTimer = TELEGRAPH_DURATION;
			}
			return;
		}

		if (phase === "telegraph") {
			const blink = Math.floor(k.time() * 18) % 2 === 0;
			boss.color = blink ? k.rgb(255, 235, 120) : k.rgb(...def.color);
			phaseTimer -= dt;
			if (phaseTimer <= 0) {
				boss.color = k.rgb(...def.color);
				facePlayer(player);
				phase = "attack";
				if (barrageMode === "burst") {
					burstShotsLeft = 3;
					burstShotTimer = 0;
				} else {
					fireFanShot(player);
					phase = "recover";
					phaseTimer = 0.45;
					barrageMode = "burst";
				}
			}
			return;
		}

		if (phase === "attack") {
			burstShotTimer -= dt;
			if (burstShotTimer <= 0 && burstShotsLeft > 0) {
				const slotIndex = 3 - burstShotsLeft;
				fireBurstShot(slotIndex);
				burstShotsLeft -= 1;
				burstShotTimer = 0.14;
			}
			if (burstShotsLeft <= 0) {
				phase = "recover";
				phaseTimer = 0.4;
				barrageMode = "fan";
			}
			return;
		}

		if (phase === "recover") {
			phaseTimer -= dt;
			if (phaseTimer <= 0) {
				phase = "move";
				attackTimer = def.attackCooldown;
			}
		}
	};

	const updateTeleportLaser = (dt: number, player: GameObj | null): void => {
		if (phase === "move") {
			facePlayer(player);
			boss.move(dir * def.speed * 0.45, 0);
			clampX();

			attackTimer -= dt;
			if (attackTimer <= 0) {
				teleportTarget = pickTeleportSpot(player);
				phase = "teleportOut";
				phaseTimer = TELEPORT_FADE_DURATION;
			}
			return;
		}

		if (phase === "teleportOut") {
			phaseTimer -= dt;
			boss.opacity = Math.max(0.15, phaseTimer / TELEPORT_FADE_DURATION);
			if (phaseTimer <= 0 && teleportTarget) {
				boss.pos = teleportTarget.clone();
				boss.vel.y = 0;
				boss.opacity = 1;
				facePlayer(player);
				startAimLine(player);
				phase = "telegraph";
				phaseTimer = LASER_CHARGE_DURATION;
			}
			return;
		}

		if (phase === "telegraph") {
			const blink = Math.floor(k.time() * 20) % 2 === 0;
			boss.color = blink ? k.rgb(255, 110, 155) : k.rgb(...def.color);
			phaseTimer -= dt;
			if (phaseTimer <= 0) {
				boss.color = k.rgb(...def.color);
				clearAimLine();
				const origin = k.vec2(boss.pos.x, boss.pos.y - def.height * 0.55);
				for (const offset of [0, 18]) {
					spawnEnemyProjectile({
						pos: origin.add(aimDir.scale(offset)),
						dir: aimDir,
						speed: LASER_SPEED,
						range: LASER_RANGE,
						damage: def.contactDamage,
						color: [0, 255, 224],
					});
				}
				phase = "recover";
				phaseTimer = 0.45;
			}
			return;
		}

		if (phase === "recover") {
			phaseTimer -= dt;
			if (phaseTimer <= 0) {
				phase = "move";
				attackTimer = def.attackCooldown;
			}
		}
	};

	emitBossUpdated(boss);

	boss.onUpdate(() => {
		const dt = k.dt();

		if (phase === "defeat") {
			phaseTimer -= dt;
			const progress = Math.max(0, phaseTimer / DEFEAT_DURATION);
			boss.opacity = progress;
			boss.scale = k.vec2(progress, progress);
			const blink = Math.floor(k.time() * 22) % 2 === 0;
			boss.color = blink ? k.rgb(255, 255, 255) : k.rgb(...def.color);
			if (phaseTimer <= 0) {
				k.trigger("boss:victory", "boss");
				boss.destroy();
			}
			return;
		}

		if (flashTimer > 0) {
			flashTimer -= dt;
			if (flashTimer <= 0 && phase !== "telegraph") {
				boss.color = k.rgb(...def.color);
			}
		}

		const player = getPlayer();
		if (def.pattern === "chargeMelee") {
			updateChargeMelee(dt, player);
		} else if (def.pattern === "projectileBarrage") {
			updateProjectileBarrage(dt, player);
		} else {
			updateTeleportLaser(dt, player);
		}
	});

	boss.onDestroy(() => {
		clearAimLine();
	});

	return boss;
}
