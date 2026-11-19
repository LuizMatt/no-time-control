import type { GameObj, Vec2 } from "kaplay";
import { k } from "../core/k";
import { shouldResolvePlatformCollision } from "../core/physics";
import { state } from "../core/state";
import type { BossDef } from "../types";
import { spawnEnemyProjectile } from "./projectile";

export interface ArenaBounds {
	leftX: number;
	rightX: number;
	floorY: number;
}

type BossPhase =
	| "move"
	| "telegraph"
	| "attack"
	| "recover"
	| "teleportOut"
	| "teleportIn"
	| "defeat";

type BossAnim =
	| "idle"
	| "walk"
	| "telegraph"
	| "attack"
	| "melee"
	| "teleportOut"
	| "teleportIn"
	| "death";

type PastMove = "dash" | "melee" | "leap";
type PresentMove = "burst" | "fan" | "repositionLeap";
type FutureMove = "teleportLaser" | "blinkSlash";

const BOSS_SPRITE_SCALE = 3.2;
const TELEGRAPH_DURATION = 0.42;
const LASER_CHARGE_DURATION = 0.55;
const TELEPORT_FADE_DURATION = 0.24;
const TELEPORT_IN_DURATION = 0.22;
const DEFEAT_DURATION = 1.5;

const CHARGE_SPEED_MULT = 2.65;
const CHARGE_DURATION = 0.65;
const CHARGE_JUMP_FORCE = 520;

const BOSS_PROJECTILE_SPEED = 430;
const BOSS_PROJECTILE_RANGE = 960;
const LASER_SPEED = 900;
const LASER_RANGE = 1150;

/** Instantiates the adaptive Era Boss entity with intelligent distance-aware AI, enrage phase, and animations. */
export function makeBoss(def: BossDef, spawnPos: Vec2, arenaBounds: ArenaBounds): GameObj {
	const hasSprite = Boolean(def.sprite);
	const localScale = hasSprite ? BOSS_SPRITE_SCALE : 1;
	const baseTint: [number, number, number] = hasSprite ? [255, 255, 255] : def.color;

	let dir: 1 | -1 = -1;
	let phase: BossPhase = "move";
	let phaseTimer = 0;
	let attackTimer = 0.85;
	let flashTimer = 0;
	let isDead = false;
	let currentAnim: BossAnim = "walk";

	// Pattern-specific AI state
	let chargeDir: 1 | -1 = -1;
	let pastMove: PastMove = "dash";
	let meleeHitDone = false;

	let presentMove: PresentMove = "burst";
	let burstShotsLeft = 0;
	let burstShotTimer = 0;
	let leapVelX = 0;

	let futureMove: FutureMove = "teleportLaser";
	let teleportTarget: Vec2 | null = null;
	let aimDir: Vec2 = k.vec2(-1, 0);
	let aimLine: GameObj | null = null;
	let laserFollowupPending = false;

	const minX = arenaBounds.leftX + def.width / 2 + 10;
	const maxX = arenaBounds.rightX - def.width / 2 - 10;
	const arenaWidth = maxX - minX;

	const teleportSpots: Vec2[] = [
		k.vec2(arenaBounds.leftX + 84, arenaBounds.floorY),
		k.vec2(arenaBounds.rightX - 84, arenaBounds.floorY),
		k.vec2(arenaBounds.leftX + arenaWidth * 0.34, arenaBounds.floorY),
		k.vec2(arenaBounds.leftX + arenaWidth * 0.66, arenaBounds.floorY),
		k.vec2(arenaBounds.leftX + 220, arenaBounds.floorY - 128),
		k.vec2(arenaBounds.rightX - 220, arenaBounds.floorY - 128),
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
		def.sprite
			? k.sprite(def.sprite, { anim: "walk", flipX: true })
			: k.rect(def.width, def.height, { radius: 4 }),
		k.pos(spawnPos),
		k.anchor("bot"),
		def.sprite
			? k.area({
					shape: new k.Rect(
						k.vec2(0, 0),
						def.width / BOSS_SPRITE_SCALE,
						def.height / BOSS_SPRITE_SCALE,
					),
				})
			: k.area(),
		k.body(),
		k.scale(localScale),
		k.color(...baseTint),
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
					boss.color = hasSprite ? k.rgb(245, 237, 186) : k.rgb(255, 255, 255);
				}
				emitBossUpdated(boss);

				if (boss.hp <= 0) {
					isDead = true;
					phase = "defeat";
					phaseTimer = DEFEAT_DURATION;
					clearAimLine();
					for (const proj of k.get("enemyProjectile")) {
						if (proj.exists()) {
							proj.destroy();
						}
					}
					boss.color = k.rgb(...baseTint);
					boss.opacity = 1;
					playBossAnim("death", true);
					state.bossDefeated = true;
					state.bossActive = false;
					boss.trigger("combat:kill", boss);
					boss.trigger("boss:defeated", boss);
				}
			},
		},
	]);

	function playBossAnim(anim: BossAnim, force = false): void {
		if (!hasSprite) return;
		if (!force && currentAnim === anim) return;
		currentAnim = anim;
		boss.play(anim);
	}

	const isEnraged = (): boolean => boss.hp <= boss.maxHp * 0.5;
	const speedMult = (): number => (isEnraged() ? 1.2 : 1);
	const cooldownMult = (): number => (isEnraged() ? 0.72 : 1);

	boss.onBeforePhysicsResolve((col) => {
		if (!shouldResolvePlatformCollision(col)) {
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

	const resolveMeleeHit = (player: GameObj | null, reachX: number, reachY: number): void => {
		if (!player) return;
		const dx = player.pos.x - boss.pos.x;
		const dy = Math.abs(player.pos.y - boss.pos.y);
		const inFront = dir === 1 ? dx >= -16 && dx <= reachX : dx <= 16 && dx >= -reachX;
		if (inFront && dy <= reachY) {
			damagePlayerOnTouch(player);
		}
	};

	const spawnShockwave = (speed: number): void => {
		for (const waveDir of [-1, 1] as const) {
			spawnEnemyProjectile({
				pos: k.vec2(boss.pos.x + waveDir * 24, boss.pos.y - 16),
				dir: k.vec2(waveDir, 0),
				speed,
				range: 420,
				damage: def.contactDamage,
				color: [228, 148, 58],
				spriteName: "enemy-present-bullet",
			});
		}
	};

	const fireBurstShot = (slotIndex: number, player: GameObj | null): void => {
		const offsetsY = [-26, -56, -84];
		const offsetY = offsetsY[slotIndex % offsetsY.length];
		const origin = k.vec2(boss.pos.x + dir * (def.width / 2 + 12), boss.pos.y + offsetY);

		// Aim slightly toward player elevation on the middle shot so jumping/standing both feel dynamic
		let shotDir = k.vec2(dir, 0);
		if (player && slotIndex === 1) {
			const targetY = player.pos.y - 26;
			const delta = k.vec2(player.pos.x - origin.x, targetY - origin.y);
			if (delta.len() > 20) {
				shotDir = delta.unit();
			}
		}

		spawnEnemyProjectile({
			pos: origin,
			dir: shotDir,
			speed: BOSS_PROJECTILE_SPEED * speedMult(),
			range: BOSS_PROJECTILE_RANGE,
			damage: def.contactDamage,
			color: def.color,
			spriteName: def.era === "present" ? "enemy-present-bullet" : undefined,
		});
	};

	const fireFanShot = (player: GameObj | null): void => {
		const origin = k.vec2(boss.pos.x + dir * (def.width / 2 + 12), boss.pos.y - def.height * 0.56);
		const targetPos = player
			? k.vec2(player.pos.x, player.pos.y - 24)
			: k.vec2(origin.x + dir * 220, origin.y);
		const baseAngle = Math.atan2(targetPos.y - origin.y, targetPos.x - origin.x);
		const spreadAngles = isEnraged() ? [-0.34, -0.17, 0, 0.17, 0.34] : [-0.26, 0, 0.26];

		for (const offset of spreadAngles) {
			const angle = baseAngle + offset;
			spawnEnemyProjectile({
				pos: origin,
				dir: k.vec2(Math.cos(angle), Math.sin(angle)),
				speed: BOSS_PROJECTILE_SPEED * 0.94 * speedMult(),
				range: BOSS_PROJECTILE_RANGE,
				damage: def.contactDamage,
				color: def.color,
				spriteName: def.era === "present" ? "enemy-present-bullet" : undefined,
			});
		}
	};

	const pickTeleportSpot = (player: GameObj | null, preferBehindPlayer: boolean): Vec2 => {
		if (preferBehindPlayer && player) {
			const playerFacing =
				(player as GameObj & { getFacing?: () => 1 | -1 }).getFacing?.() ?? 1;
			const behindX = Math.max(
				minX + 16,
				Math.min(maxX - 16, player.pos.x - playerFacing * 110),
			);
			const altX = Math.max(
				minX + 16,
				Math.min(maxX - 16, player.pos.x + playerFacing * 110),
			);
			const chosenX = Math.abs(behindX - player.pos.x) >= 75 ? behindX : altX;
			return k.vec2(chosenX, arenaBounds.floorY);
		}

		const candidates = teleportSpots.filter((spot) => spot.dist(boss.pos) > 120);
		if (candidates.length === 0) return teleportSpots[0];
		if (!player) return candidates[Math.floor(Math.random() * candidates.length)];

		const sorted = [...candidates].sort((a, b) => b.dist(player.pos) - a.dist(player.pos));
		const topCount = Math.min(3, sorted.length);
		return sorted[Math.floor(Math.random() * topCount)];
	};

	const startAimLine = (player: GameObj | null): void => {
		clearAimLine();
		const origin = k.vec2(boss.pos.x, boss.pos.y - def.height * 0.56);
		const targetPos = player
			? k.vec2(player.pos.x, player.pos.y - 24)
			: k.vec2(origin.x + dir * 300, origin.y);
		const delta = targetPos.sub(origin);
		aimDir = delta.len() > 0 ? delta.unit() : k.vec2(dir, 0);
		const angleDeg = (Math.atan2(aimDir.y, aimDir.x) * 180) / Math.PI;

		aimLine = k.add([
			k.rect(980, 3),
			k.pos(origin),
			k.anchor("left"),
			k.rotate(angleDeg),
			k.color(255, 95, 135),
			k.opacity(0.85),
			k.z(14),
		]);
	};

	const updateAimLineTracking = (player: GameObj | null, dt: number): void => {
		if (!aimLine || !aimLine.exists() || !player) return;
		const origin = k.vec2(boss.pos.x, boss.pos.y - def.height * 0.56);
		const targetPos = k.vec2(player.pos.x, player.pos.y - 24);
		const desired = targetPos.sub(origin);
		if (desired.len() <= 0) return;
		const desiredUnit = desired.unit();
		const trackRate = isEnraged() ? 4.2 : 2.8;
		aimDir = aimDir.lerp(desiredUnit, Math.min(1, dt * trackRate)).unit();
		aimLine.pos = origin;
		aimLine.angle = (Math.atan2(aimDir.y, aimDir.x) * 180) / Math.PI;
	};

	// ============================================================
	// 1. PASSADO — Rei Imortal (Melee Punish + Dash + Leap Slam)
	// ============================================================
	const updateChargeMelee = (dt: number, player: GameObj | null): void => {
		if (phase === "move") {
			facePlayer(player);
			const dist = player ? Math.abs(player.pos.x - boss.pos.x) : 260;
			boss.move(dir * def.speed * speedMult(), 0);
			clampX();
			playBossAnim("walk");

			attackTimer -= dt;
			// Punish player quickly if they stay right in melee range
			if (dist <= 115 && attackTimer <= def.attackCooldown * 0.55) {
				pastMove = "melee";
				meleeHitDone = false;
				chargeDir = dir;
				phase = "telegraph";
				phaseTimer = TELEGRAPH_DURATION * 0.72;
				playBossAnim("telegraph", true);
				return;
			}

			if (attackTimer <= 0) {
				chargeDir = dir;
				if (dist <= 130) {
					pastMove = "melee";
				} else if (dist > 340 || (isEnraged() && Math.random() < 0.4)) {
					pastMove = "leap";
				} else {
					pastMove = "dash";
				}
				meleeHitDone = false;
				phase = "telegraph";
				phaseTimer = TELEGRAPH_DURATION * cooldownMult();
				playBossAnim("telegraph", true);
			}
			return;
		}

		if (phase === "telegraph") {
			facePlayer(player);
			chargeDir = dir;
			const blink = Math.floor(k.time() * 18) % 2 === 0;
			boss.color = blink ? k.rgb(245, 237, 186) : k.rgb(...baseTint);
			phaseTimer -= dt;
			if (phaseTimer <= 0) {
				boss.color = k.rgb(...baseTint);
				phase = "attack";
				if (pastMove === "melee") {
					phaseTimer = 0.38;
					playBossAnim("melee", true);
				} else if (pastMove === "leap") {
					phaseTimer = 0.75;
					const targetX = player ? player.pos.x : boss.pos.x + chargeDir * 240;
					leapVelX = Math.max(-460, Math.min(460, (targetX - boss.pos.x) * 1.35));
					if (boss.isGrounded()) {
						boss.jump(CHARGE_JUMP_FORCE * 1.15);
					}
					playBossAnim("attack", true);
				} else {
					phaseTimer = CHARGE_DURATION;
					playBossAnim("attack", true);
				}
			}
			return;
		}

		if (phase === "attack") {
			phaseTimer -= dt;
			if (pastMove === "melee") {
				boss.move(chargeDir * def.speed * 0.55, 0);
				clampX();
				if (!meleeHitDone && phaseTimer <= 0.22) {
					meleeHitDone = true;
					resolveMeleeHit(player, def.width * 0.95 + 52, def.height + 16);
					k.shake(4);
				}
				if (phaseTimer <= 0) {
					phase = "recover";
					phaseTimer = 0.35 * cooldownMult();
				}
				return;
			}

			if (pastMove === "leap") {
				boss.move(leapVelX, 0);
				clampX();
				if (phaseTimer <= 0.5 && boss.isGrounded()) {
					k.shake(7);
					spawnShockwave(isEnraged() ? 380 : 300);
					playBossAnim("melee", true);
					phase = "recover";
					phaseTimer = 0.45 * cooldownMult();
				}
				return;
			}

			// Dash charge — brakes early if it overshoots past the player
			boss.move(chargeDir * def.speed * CHARGE_SPEED_MULT * speedMult(), 0);
			const hitWall =
				(chargeDir === -1 && boss.pos.x <= minX) ||
				(chargeDir === 1 && boss.pos.x >= maxX);
			const passedPlayer =
				player !== null &&
				((chargeDir === 1 && boss.pos.x > player.pos.x + 120) ||
					(chargeDir === -1 && boss.pos.x < player.pos.x - 120));
			clampX();

			if (hitWall || passedPlayer || phaseTimer <= 0) {
				if (hitWall) {
					k.shake(6);
					if (isEnraged()) {
						spawnShockwave(340);
					}
				}
				playBossAnim("melee", true);
				phase = "recover";
				phaseTimer = 0.42 * cooldownMult();
			}
			return;
		}

		if (phase === "recover") {
			phaseTimer -= dt;
			if (phaseTimer <= 0 && boss.isGrounded()) {
				phase = "move";
				attackTimer = def.attackCooldown * cooldownMult();
			}
		}
	};

	// ============================================================
	// 2. PRESENTE — Projeto Titã (Zoning + Reposition Leap + Barrage/Fan)
	// ============================================================
	const updateProjectileBarrage = (dt: number, player: GameObj | null): void => {
		if (phase === "move") {
			facePlayer(player);
			let moved = false;
			const dist = player ? Math.abs(player.pos.x - boss.pos.x) : 260;
			const nearLeftWall = boss.pos.x <= minX + 48;
			const nearRightWall = boss.pos.x >= maxX - 48;
			const cornered =
				dist < 165 && ((dir === 1 && nearLeftWall) || (dir === -1 && nearRightWall));

			if (cornered && boss.isGrounded()) {
				// Jump over the player to escape being cornered
				presentMove = "repositionLeap";
				leapVelX = dir * 340;
				boss.jump(CHARGE_JUMP_FORCE * 1.12);
				phase = "attack";
				phaseTimer = 0.65;
				playBossAnim("walk", true);
				return;
			}

			if (player) {
				if (dist < 210) {
					boss.move(-dir * def.speed * speedMult(), 0);
					moved = true;
				} else if (dist > 370) {
					boss.move(dir * def.speed * speedMult(), 0);
					moved = true;
				}
				clampX();
			}
			playBossAnim(moved ? "walk" : "idle");

			attackTimer -= dt;
			if (attackTimer <= 0) {
				const playerElevated = player !== null && player.pos.y < boss.pos.y - 45;
				// Choose fan spread when player is jumping/high or close; burst when grounded at mid/long range
				presentMove =
					playerElevated || dist < 240
						? "fan"
						: presentMove === "burst"
							? "fan"
							: "burst";
				phase = "telegraph";
				phaseTimer = TELEGRAPH_DURATION * cooldownMult();
				playBossAnim("telegraph", true);
			}
			return;
		}

		if (phase === "telegraph") {
			facePlayer(player);
			const blink = Math.floor(k.time() * 18) % 2 === 0;
			boss.color = blink ? k.rgb(245, 237, 186) : k.rgb(...baseTint);
			phaseTimer -= dt;
			if (phaseTimer <= 0) {
				boss.color = k.rgb(...baseTint);
				facePlayer(player);
				phase = "attack";
				playBossAnim("attack", true);
				if (presentMove === "burst") {
					burstShotsLeft = isEnraged() ? 4 : 3;
					burstShotTimer = 0;
				} else {
					fireFanShot(player);
					phase = "recover";
					phaseTimer = 0.42 * cooldownMult();
				}
			}
			return;
		}

		if (phase === "attack") {
			if (presentMove === "repositionLeap") {
				boss.move(leapVelX, 0);
				clampX();
				phaseTimer -= dt;
				if (phaseTimer <= 0.4 && boss.isGrounded()) {
					facePlayer(player);
					fireFanShot(player);
					playBossAnim("attack", true);
					phase = "recover";
					phaseTimer = 0.35;
				}
				return;
			}

			burstShotTimer -= dt;
			if (burstShotTimer <= 0 && burstShotsLeft > 0) {
				const total = isEnraged() ? 4 : 3;
				const slotIndex = total - burstShotsLeft;
				fireBurstShot(slotIndex, player);
				playBossAnim("attack", true);
				burstShotsLeft -= 1;
				burstShotTimer = isEnraged() ? 0.11 : 0.14;
			}
			if (burstShotsLeft <= 0) {
				phase = "recover";
				phaseTimer = 0.38 * cooldownMult();
			}
			return;
		}

		if (phase === "recover") {
			phaseTimer -= dt;
			if (phaseTimer <= 0) {
				phase = "move";
				attackTimer = def.attackCooldown * cooldownMult();
			}
		}
	};

	// ============================================================
	// 3. FUTURO — Cronos (Teleport Ambush Slash + Tracking Laser)
	// ============================================================
	const updateTeleportLaser = (dt: number, player: GameObj | null): void => {
		if (phase === "move") {
			facePlayer(player);
			boss.move(dir * def.speed * 0.55 * speedMult(), 0);
			clampX();
			playBossAnim("walk");

			attackTimer -= dt;
			if (attackTimer <= 0) {
				// Alternate between long-range laser and surprise blink-slash behind the player
				const doAmbush = Math.random() < (isEnraged() ? 0.48 : 0.35);
				futureMove = doAmbush ? "blinkSlash" : "teleportLaser";
				laserFollowupPending = isEnraged() && futureMove === "teleportLaser";
				meleeHitDone = false;
				teleportTarget = pickTeleportSpot(player, doAmbush);
				phase = "teleportOut";
				phaseTimer = TELEPORT_FADE_DURATION;
				playBossAnim("teleportOut", true);
			}
			return;
		}

		if (phase === "teleportOut") {
			phaseTimer -= dt;
			if (!hasSprite) {
				boss.opacity = Math.max(0.15, phaseTimer / TELEPORT_FADE_DURATION);
			}
			if (phaseTimer <= 0 && teleportTarget) {
				boss.pos = teleportTarget.clone();
				boss.vel.y = 0;
				boss.opacity = 1;
				facePlayer(player);
				if (hasSprite) {
					phase = "teleportIn";
					phaseTimer = TELEPORT_IN_DURATION;
					playBossAnim("teleportIn", true);
				} else {
					startAimLine(player);
					phase = "telegraph";
					phaseTimer = LASER_CHARGE_DURATION;
				}
			}
			return;
		}

		if (phase === "teleportIn") {
			phaseTimer -= dt;
			if (phaseTimer <= 0) {
				facePlayer(player);
				if (futureMove === "blinkSlash") {
					phase = "telegraph";
					phaseTimer = 0.28;
					playBossAnim("telegraph", true);
				} else {
					startAimLine(player);
					phase = "telegraph";
					phaseTimer = LASER_CHARGE_DURATION * cooldownMult();
					playBossAnim("telegraph", true);
				}
			}
			return;
		}

		if (phase === "telegraph") {
			facePlayer(player);
			const blink = Math.floor(k.time() * 20) % 2 === 0;
			boss.color = blink ? k.rgb(126, 196, 193) : k.rgb(...baseTint);
			phaseTimer -= dt;

			// Track the player during the first 60% of the laser charge, then lock aim so player can dodge
			if (futureMove === "teleportLaser" && phaseTimer > LASER_CHARGE_DURATION * 0.38) {
				updateAimLineTracking(player, dt);
			}

			if (phaseTimer <= 0) {
				boss.color = k.rgb(...baseTint);
				clearAimLine();

				if (futureMove === "blinkSlash") {
					phase = "attack";
					phaseTimer = 0.36;
					playBossAnim("melee", true);
				} else {
					playBossAnim("attack", true);
					const origin = k.vec2(boss.pos.x, boss.pos.y - def.height * 0.56);
					const offsets = isEnraged() ? [0, 18, 36] : [0, 18];
					for (const offset of offsets) {
						spawnEnemyProjectile({
							pos: origin.add(aimDir.scale(offset)),
							dir: aimDir,
							speed: LASER_SPEED * speedMult(),
							range: LASER_RANGE,
							damage: def.contactDamage,
							color: [0, 255, 224],
							spriteName: "enemy-future-plasma",
						});
					}
					k.shake(5);

					if (laserFollowupPending) {
						laserFollowupPending = false;
						teleportTarget = pickTeleportSpot(player, false);
						phase = "teleportOut";
						phaseTimer = TELEPORT_FADE_DURATION;
						playBossAnim("teleportOut", true);
					} else {
						phase = "recover";
						phaseTimer = 0.42 * cooldownMult();
					}
				}
			}
			return;
		}

		if (phase === "attack") {
			phaseTimer -= dt;
			boss.move(dir * def.speed * 0.7, 0);
			clampX();
			if (!meleeHitDone && phaseTimer <= 0.22) {
				meleeHitDone = true;
				resolveMeleeHit(player, def.width + 68, def.height + 20);
				k.shake(5);
			}
			if (phaseTimer <= 0) {
				phase = "recover";
				phaseTimer = 0.38 * cooldownMult();
			}
			return;
		}

		if (phase === "recover") {
			phaseTimer -= dt;
			if (phaseTimer <= 0) {
				phase = "move";
				attackTimer = def.attackCooldown * cooldownMult();
			}
		}
	};

	emitBossUpdated(boss);

	boss.onUpdate(() => {
		const dt = k.dt();

		if (phase === "defeat") {
			phaseTimer -= dt;
			const progress = Math.max(0, phaseTimer / DEFEAT_DURATION);
			if (hasSprite) {
				boss.opacity = progress < 0.3 ? progress / 0.3 : 1;
			} else {
				boss.opacity = progress;
				boss.scale = k.vec2(progress, progress);
				const blink = Math.floor(k.time() * 22) % 2 === 0;
				boss.color = blink ? k.rgb(255, 255, 255) : k.rgb(...baseTint);
			}
			if (phaseTimer <= 0) {
				k.trigger("boss:victory", "boss");
				boss.destroy();
			}
			return;
		}

		if (flashTimer > 0) {
			flashTimer -= dt;
			if (flashTimer <= 0 && phase !== "telegraph") {
				boss.color = k.rgb(...baseTint);
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

		if (hasSprite) {
			const activeDir =
				phase === "attack" && def.pattern === "chargeMelee" && pastMove === "dash"
					? chargeDir
					: dir;
			boss.flipX = activeDir === -1;
		}
	});

	boss.onDestroy(() => {
		clearAimLine();
	});

	return boss;
}
