import type { GameObj, Vec2 } from "kaplay";
import { FALL_DEATH_Y } from "../core/constants";
import { k } from "../core/k";
import type { EnemyDef } from "../types";
import { spawnEnemyProjectile } from "./projectile";

const PATROL_RANGE = 96;
const CHASE_DETECT_RANGE = 280;
const SHOOT_DETECT_RANGE = 420;
const SHOOT_COOLDOWN = 1.65;
const ENEMY_PROJECTILE_SPEED = 340;
const ENEMY_PROJECTILE_RANGE = 440;

/** Instantiates an enemy entity from its definition with modular AI behavior and HP bar. */
export function makeEnemy(def: EnemyDef, spawnPos: Vec2): GameObj {
	const isFlying = def.behavior === "fly";
	const initialPos = isFlying
		? k.vec2(spawnPos.x, spawnPos.y - 46)
		: spawnPos.clone();

	let dir: 1 | -1 = -1;
	let flashTimer = 0;
	let shootTimer = 0.8;
	let flyPhase = 0;
	let isDead = false;

	const enemy = k.add([
		k.rect(def.width, def.height, { radius: 3 }),
		k.pos(initialPos),
		k.anchor("bot"),
		k.area(),
		k.body({ gravityScale: isFlying ? 0 : 1 }),
		k.color(...def.color),
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
					enemy.color = k.rgb(255, 255, 255);
				}
				if (enemy.hp <= 0) {
					isDead = true;
					enemy.trigger("combat:kill", enemy);
					enemy.destroy();
				}
			},
		},
	]);

	enemy.onBeforePhysicsResolve((col) => {
		if (isFlying || !col.target.is("platform")) {
			col.preventResolution();
		}
	});

	const hpBarWidth = Math.max(24, def.width);
	enemy.add([
		k.rect(hpBarWidth, 4),
		k.pos(0, -def.height - 8),
		k.anchor("center"),
		k.color(30, 34, 44),
	]);

	const hpBarFill = enemy.add([
		k.rect(hpBarWidth, 4),
		k.pos(-hpBarWidth / 2, -def.height - 8),
		k.anchor("left"),
		k.color(...def.color),
	]);

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

	const behaviors: Record<EnemyDef["behavior"], (dt: number) => void> = {
		patrol: () => {
			moveGrounded(def.speed, true);
			if (Math.abs(enemy.pos.x - initialPos.x) >= PATROL_RANGE) {
				dir = enemy.pos.x > initialPos.x ? -1 : 1;
			}
		},
		chase: () => {
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
				spawnEnemyProjectile({
					pos: k.vec2(enemy.pos.x + dir * (def.width / 2 + 8), enemy.pos.y - def.height * 0.55),
					dir: k.vec2(dir, 0),
					speed: def.era === "future" ? ENEMY_PROJECTILE_SPEED * 1.25 : ENEMY_PROJECTILE_SPEED,
					range: ENEMY_PROJECTILE_RANGE,
					damage: def.contactDamage,
					color: def.color,
				});
			}
		},
	};

	enemy.onUpdate(() => {
		if (isDead) return;

		const dt = k.dt();

		if (flashTimer > 0) {
			flashTimer -= dt;
			if (flashTimer <= 0) {
				enemy.color = k.rgb(...def.color);
			}
		}

		const ratio = Math.max(0, Math.min(1, enemy.hp / enemy.maxHp));
		hpBarFill.width = hpBarWidth * ratio;

		behaviors[def.behavior](dt);

		if (enemy.pos.y > FALL_DEATH_Y) {
			isDead = true;
			enemy.destroy();
		}
	});

	return enemy;
}
