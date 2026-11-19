import type { GameObj, Vec2 } from "kaplay";
import { k } from "../core/k";
import type { CombatTarget, Era } from "../types";

export type PlayerProjectileSprite = "bullet" | "plasma";

export interface PlayerProjectileOpts {
	pos: Vec2;
	dir: 1 | -1;
	speed: number;
	range: number;
	baseDamage: number;
	weaponEra: Era | "universal";
	piercing: boolean;
	color: [number, number, number];
	spriteName?: PlayerProjectileSprite;
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

const PROJECTILE_SPRITE_SCALE = 1.25;

function spawnImpactEffect(
	pos: Vec2,
	spriteName: PlayerProjectileSprite,
	dir: 1 | -1,
): void {
	const fx = k.add([
		k.sprite(spriteName, { anim: "hit", flipX: dir === -1 }),
		k.pos(pos),
		k.anchor("center"),
		k.scale(PROJECTILE_SPRITE_SCALE),
		k.z(16),
	]);
	fx.onAnimEnd(() => {
		if (fx.exists()) {
			fx.destroy();
		}
	});
}

function bindPlatformCollision(
	proj: GameObj,
	onPlatformHit?: () => void,
): void {
	proj.onCollide("platform", (obj: GameObj) => {
		if (!proj.exists() || obj.is("oneway")) return;
		onPlatformHit?.();
		proj.destroy();
	});
}

/** Spawns a player projectile that damages combatTarget entities and respects piercing rules. */
export function spawnPlayerProjectile(opts: PlayerProjectileOpts): GameObj {
	const hitIds = new Set<number>();
	const startX = opts.pos.x;
	const hitboxW = opts.piercing ? 24 : 18;
	const hitboxH = opts.piercing ? 18 : 8;

	const proj = opts.spriteName
		? k.add([
				k.sprite(opts.spriteName, { anim: "fly", flipX: opts.dir === -1 }),
				k.pos(opts.pos),
				k.anchor("center"),
				k.scale(PROJECTILE_SPRITE_SCALE),
				k.area({
					shape: new k.Rect(
						k.vec2(-hitboxW / 2, -hitboxH / 2),
						hitboxW,
						hitboxH,
					),
				}),
				k.z(15),
				"playerProjectile",
				{
					weaponEra: opts.weaponEra,
					baseDamage: opts.baseDamage,
					piercing: opts.piercing,
				},
			])
		: k.add([
				k.rect(opts.piercing ? 22 : 14, opts.piercing ? 8 : 6, { radius: 2 }),
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

	bindPlatformCollision(proj, () => {
		if (opts.spriteName) {
			spawnImpactEffect(proj.pos.clone(), opts.spriteName, opts.dir);
		}
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
		if (opts.spriteName) {
			spawnImpactEffect(proj.pos.clone(), opts.spriteName, opts.dir);
		}

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

	bindPlatformCollision(proj);

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
