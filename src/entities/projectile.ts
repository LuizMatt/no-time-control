import type { GameObj, Vec2 } from "kaplay";
import { k } from "../core/k";
import type { CombatTarget, Era } from "../types";

export interface PlayerProjectileOpts {
	pos: Vec2;
	dir: 1 | -1;
	speed: number;
	range: number;
	baseDamage: number;
	weaponEra: Era | "universal";
	piercing: boolean;
	color: [number, number, number];
	onHit: (target: CombatTarget, weaponEra: Era | "universal", baseDamage: number) => void;
}

export interface EnemyProjectileOpts {
	pos: Vec2;
	dir: Vec2;
	speed: number;
	range: number;
	damage: number;
	color: [number, number, number];
}

/** Spawns a player projectile that damages combatTarget entities and respects piercing rules. */
export function spawnPlayerProjectile(opts: PlayerProjectileOpts): GameObj {
	const hitIds = new Set<number>();
	const startX = opts.pos.x;
	const width = opts.piercing ? 22 : 14;
	const height = opts.piercing ? 8 : 6;

	const proj = k.add([
		k.rect(width, height, { radius: 2 }),
		k.pos(opts.pos),
		k.anchor("center"),
		k.area(),
		k.color(...opts.color),
		k.z(15),
		"playerProjectile",
		{
			weaponEra: opts.weaponEra,
			baseDamage: opts.baseDamage,
			piercing: opts.piercing,
		},
	]);

	proj.onUpdate(() => {
		proj.move(opts.dir * opts.speed, 0);
		if (Math.abs(proj.pos.x - startX) >= opts.range) {
			proj.destroy();
		}
	});

	proj.onCollide("platform", () => {
		if (!proj.exists()) return;
		proj.destroy();
	});

	proj.onCollide("combatTarget", (obj: GameObj) => {
		if (!proj.exists()) return;
		const target = obj as unknown as CombatTarget;
		const targetId = target.id ?? -1;
		if (targetId !== -1 && hitIds.has(targetId)) {
			return;
		}
		if (targetId !== -1) {
			hitIds.add(targetId);
		}

		opts.onHit(target, opts.weaponEra, opts.baseDamage);

		if (!opts.piercing) {
			proj.destroy();
		}
	});

	return proj;
}

/** Spawns an enemy or boss projectile that damages the player on collision. */
export function spawnEnemyProjectile(opts: EnemyProjectileOpts): GameObj {
	const startPos = opts.pos.clone();
	const unitDir = opts.dir.len() > 0 ? opts.dir.unit() : k.vec2(1, 0);

	const proj = k.add([
		k.rect(12, 6, { radius: 2 }),
		k.pos(opts.pos),
		k.anchor("center"),
		k.area(),
		k.color(...opts.color),
		k.z(15),
		"enemyProjectile",
	]);

	proj.onUpdate(() => {
		proj.move(unitDir.scale(opts.speed));
		if (proj.pos.dist(startPos) >= opts.range) {
			proj.destroy();
		}
	});

	proj.onCollide("platform", () => {
		if (!proj.exists()) return;
		proj.destroy();
	});

	proj.onCollide("player", (playerObj: GameObj) => {
		if (!proj.exists()) return;
		const target = playerObj as GameObj & {
			takeDamage?: (amount: number) => void;
			isInvulnerable?: () => boolean;
		};
		if (target.isInvulnerable?.()) {
			return;
		}
		target.takeDamage?.(opts.damage);
		proj.destroy();
	});

	return proj;
}
