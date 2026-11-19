import type { GameObj, Vec2 } from "kaplay";
import { FALL_DEATH_Y } from "../core/constants";
import { k } from "../core/k";
import { shouldResolvePlatformCollision } from "../core/physics";
import type { EnemyDef } from "../types";
import { spawnEnemyProjectile } from "./projectile";

const PATROL_RANGE = 96;
const CHASE_DETECT_RANGE = 280;
const SHOOT_DETECT_RANGE = 420;
const SHOOT_COOLDOWN = 1.65;
const ENEMY_PROJECTILE_SPEED = 340;
const ENEMY_PROJECTILE_RANGE = 440;
const ENEMY_SPRITE_SCALE = 2;
const HURT_ANIM_DURATION = 0.2;
const DEATH_ANIM_DURATION = 0.42;
const MELEE_ATTACK_DURATION = 0.44;
const MELEE_STRIKE_DELAY = 0.14;
const MELEE_ATTACK_COOLDOWN = 1.1;
const SHOOT_ATTACK_DURATION = 0.4;
const SHOOT_FIRE_DELAY = 0.1;

type EnemyAnim = "idle" | "walk" | "attack" | "hurt" | "death";

/** Instantiates an enemy entity from its definition with modular AI behavior and animations. */
export function makeEnemy(def: EnemyDef, spawnPos: Vec2): GameObj {
	const isFlying = def.behavior === "fly";
	const initialPos = isFlying
		? k.vec2(spawnPos.x, spawnPos.y - 46)
		: spawnPos.clone();
	const hasSprite = Boolean(def.sprite);
	const localScale = hasSprite ? ENEMY_SPRITE_SCALE : 1;
	const baseTint: [number, number, number] = hasSprite ? [255, 255, 255] : def.color;
	const meleeTriggerRange = def.width * 0.85 + 26;
	const meleeReach = def.width * 0.95 + 32;

	let dir: 1 | -1 = -1;
	let flashTimer = 0;
	let hurtAnimTimer = 0;
	let attackAnimTimer = 0;
	let attackCooldownTimer = 0;
	let attackStrikePending = false;
	let shootFirePending = false;
	let shootTimer = 0.8;
	let flyPhase = 0;
	let isDead = false;
	let currentAnim: EnemyAnim = "walk";

	function playEnemyAnim(anim: EnemyAnim): void {
		if (!hasSprite || currentAnim === anim) return;
		currentAnim = anim;
		enemy.play(anim);
	}

	const enemy = k.add([
		def.sprite
			? k.sprite(def.sprite, { anim: "walk", flipX: true })
			: k.rect(def.width, def.height, { radius: 3 }),
		k.pos(initialPos),
		k.anchor("bot"),
		def.sprite
			? k.area({
					shape: new k.Rect(
						k.vec2(0, 0),
						def.width / ENEMY_SPRITE_SCALE,
						def.height / ENEMY_SPRITE_SCALE,
					),
				})
			: k.area(),
		k.body({ gravityScale: isFlying ? 0 : 1 }),
		k.scale(localScale),
		k.color(...baseTint),
		k.z(8),
		"enemy",
		"combatTarget",
		{
			era: def.era,
			hp: def.hp,
			maxHp: def.hp,
			enemyId: def.id,
			onDamaged(_damage: number, effective: boolean): void {
				if (isDead) return;
				if (effective) {
					flashTimer = 0.12;
					enemy.color = hasSprite ? k.rgb(245, 237, 186) : k.rgb(255, 255, 255);
				}
				if (enemy.hp <= 0) {
					isDead = true;
					attackStrikePending = false;
					shootFirePending = false;
					enemy.trigger("combat:kill", enemy);
					if (hasSprite) {
						enemy.vel.x = 0;
						enemy.color = k.rgb(...baseTint);
						playEnemyAnim("death");
						k.wait(DEATH_ANIM_DURATION, () => {
							if (enemy.exists()) {
								enemy.destroy();
							}
						});
					} else {
						enemy.destroy();
					}
					return;
				}
				if (hasSprite && attackAnimTimer <= 0) {
					hurtAnimTimer = HURT_ANIM_DURATION;
					currentAnim = "hurt";
					enemy.play("hurt");
				}
			},
		},
	]);

	enemy.onBeforePhysicsResolve((col) => {
		if (isFlying || !shouldResolvePlatformCollision(col)) {
			col.preventResolution();
		}
	});

	const damagePlayerOnTouch = (playerObj: GameObj): void => {
		if (isDead) return;
		const target = playerObj as GameObj & { takeDamage?: (amount: number) => void };
		target.takeDamage?.(def.contactDamage);
	};

	enemy.onCollide("player", damagePlayerOnTouch);
	enemy.onCollideUpdate((obj) => {
		if (obj.is("player")) {
			damagePlayerOnTouch(obj);
		}
	});

	const getPlayer = (): GameObj | null => {
		const players = k.get("player");
		return players.length > 0 ? players[0] : null;
	};

	const tryStartMeleeAttack = (): boolean => {
		if (!hasSprite || attackAnimTimer > 0 || attackCooldownTimer > 0) {
			return false;
		}
		if (def.behavior !== "patrol" && def.behavior !== "chase") {
			return false;
		}
		const player = getPlayer();
		if (!player) return false;

		const deltaX = player.pos.x - enemy.pos.x;
		const deltaY = Math.abs(player.pos.y - enemy.pos.y);
		if (Math.abs(deltaX) <= meleeTriggerRange && deltaY <= def.height + 16) {
			if (Math.abs(deltaX) > 2) {
				dir = deltaX > 0 ? 1 : -1;
			}
			attackAnimTimer = MELEE_ATTACK_DURATION;
			attackCooldownTimer = MELEE_ATTACK_COOLDOWN;
			attackStrikePending = true;
			currentAnim = "attack";
			enemy.play("attack");
			return true;
		}
		return false;
	};

	const resolveMeleeStrike = (): void => {
		const player = getPlayer();
		if (!player) return;
		const deltaX = player.pos.x - enemy.pos.x;
		const deltaY = Math.abs(player.pos.y - enemy.pos.y);
		const inFront = dir === 1 ? deltaX >= -10 && deltaX <= meleeReach : deltaX <= 10 && deltaX >= -meleeReach;
		if (inFront && deltaY <= def.height + 18) {
			damagePlayerOnTouch(player);
		}
	};

	const hasGroundAhead = (checkDir: 1 | -1): boolean => {
		const hit = k.raycast(
			k.vec2(enemy.pos.x + checkDir * (def.width / 2 + 6), enemy.pos.y - 4),
			k.vec2(0, 24),
			["enemy", "player", "playerProjectile", "enemyProjectile"],
		);
		return Boolean(hit && hit.object?.is("platform"));
	};

	const moveGrounded = (speed: number, flipOnLedge: boolean): void => {
		if (enemy.isGrounded() && !hasGroundAhead(dir)) {
			if (!flipOnLedge) {
				return;
			}
			dir = dir === 1 ? -1 : 1;
			if (!hasGroundAhead(dir)) {
				return;
			}
		}
		enemy.move(dir * speed, 0);
	};

	const fireProjectile = (): void => {
		const muzzleOffsetY =
			def.sprite === "enemy-future-turret"
				? 40
				: def.sprite === "enemy-present-shooter"
					? 32
					: def.height * 0.55;
		spawnEnemyProjectile({
			pos: k.vec2(enemy.pos.x + dir * (def.width / 2 + 8), enemy.pos.y - muzzleOffsetY),
			dir: k.vec2(dir, 0),
			speed: def.era === "future" ? ENEMY_PROJECTILE_SPEED * 1.25 : ENEMY_PROJECTILE_SPEED,
			range: ENEMY_PROJECTILE_RANGE,
			damage: def.contactDamage,
			color: def.color,
			spriteName:
				def.era === "present"
					? "enemy-present-bullet"
					: def.era === "future"
						? "enemy-future-plasma"
						: undefined,
		});
	};

	const behaviors: Record<EnemyDef["behavior"], (dt: number) => void> = {
		patrol: () => {
			if (tryStartMeleeAttack()) return;
			moveGrounded(def.speed, true);
			if (Math.abs(enemy.pos.x - initialPos.x) >= PATROL_RANGE) {
				dir = enemy.pos.x > initialPos.x ? -1 : 1;
			}
		},
		chase: () => {
			if (tryStartMeleeAttack()) return;
			const player = getPlayer();
			if (player && Math.abs(player.pos.x - enemy.pos.x) <= CHASE_DETECT_RANGE) {
				const deltaX = player.pos.x - enemy.pos.x;
				if (Math.abs(deltaX) > 6) {
					dir = deltaX > 0 ? 1 : -1;
				}
				moveGrounded(def.speed, false);
			} else {
				moveGrounded(def.speed * 0.6, true);
				if (Math.abs(enemy.pos.x - initialPos.x) >= PATROL_RANGE) {
					dir = enemy.pos.x > initialPos.x ? -1 : 1;
				}
			}
		},
		fly: (dt: number) => {
			flyPhase += dt * 4;
			enemy.move(dir * def.speed, 0);
			enemy.pos.y = initialPos.y + Math.sin(flyPhase) * 18;
			if (Math.abs(enemy.pos.x - initialPos.x) >= PATROL_RANGE * 1.25) {
				dir = enemy.pos.x > initialPos.x ? -1 : 1;
			}
		},
		shoot: (dt: number) => {
			const player = getPlayer();
			if (!player) return;

			const deltaX = player.pos.x - enemy.pos.x;
			if (Math.abs(deltaX) > 4) {
				dir = deltaX > 0 ? 1 : -1;
			}

			shootTimer -= dt;
			if (Math.abs(deltaX) <= SHOOT_DETECT_RANGE && shootTimer <= 0) {
				shootTimer = SHOOT_COOLDOWN;
				if (hasSprite) {
					attackAnimTimer = SHOOT_ATTACK_DURATION;
					shootFirePending = true;
					currentAnim = "attack";
					enemy.play("attack");
				} else {
					fireProjectile();
				}
			}
		},
	};

	enemy.onUpdate(() => {
		if (isDead) return;

		const dt = k.dt();
		const prevX = enemy.pos.x;

		if (flashTimer > 0) {
			flashTimer -= dt;
			if (flashTimer <= 0) {
				enemy.color = k.rgb(...baseTint);
			}
		}

		if (hurtAnimTimer > 0) {
			hurtAnimTimer = Math.max(0, hurtAnimTimer - dt);
		}
		if (attackCooldownTimer > 0) {
			attackCooldownTimer = Math.max(0, attackCooldownTimer - dt);
		}

		if (attackAnimTimer > 0) {
			attackAnimTimer = Math.max(0, attackAnimTimer - dt);
			if (
				attackStrikePending &&
				attackAnimTimer <= MELEE_ATTACK_DURATION - MELEE_STRIKE_DELAY
			) {
				attackStrikePending = false;
				resolveMeleeStrike();
			}
			if (
				shootFirePending &&
				attackAnimTimer <= SHOOT_ATTACK_DURATION - SHOOT_FIRE_DELAY
			) {
				shootFirePending = false;
				fireProjectile();
			}
		} else {
			behaviors[def.behavior](dt);
		}

		if (hasSprite) {
			enemy.flipX = dir === -1;
			if (attackAnimTimer <= 0 && hurtAnimTimer <= 0) {
				const moved = Math.abs(enemy.pos.x - prevX) > 0.1;
				playEnemyAnim(moved ? "walk" : "idle");
			}
		}

		if (enemy.pos.y > FALL_DEATH_Y) {
			isDead = true;
			enemy.destroy();
		}
	});

	return enemy;
}
