import type { GameObj } from "kaplay";
import {
	KEYS,
	WEREWOLF_COOLDOWN,
	WEREWOLF_DAMAGE,
	WEREWOLF_RANGE,
	WRONG_ERA_MULT,
} from "../core/constants";
import { k } from "../core/k";
import { state } from "../core/state";
import { WEAPONS } from "../data/weapons";
import { spawnPlayerProjectile } from "../entities/projectile";
import type { CombatTarget, Era, WeaponHost, WeaponId } from "../types";

/** Calculates damage and effectiveness based on weapon era, target era, and werewolf state. */
export function computeDamage(
	weaponEra: Era | "universal",
	targetEra: Era,
	baseDamage: number,
): { damage: number; effective: boolean } {
	if (
		state.transformed ||
		weaponEra === "universal" ||
		weaponEra === targetEra
	) {
		return { damage: baseDamage, effective: true };
	}

	return {
		damage: Math.max(1, Math.round(baseDamage * WRONG_ERA_MULT)),
		effective: false,
	};
}

function spawnDamageFeedback(
	x: number,
	y: number,
	damage: number,
	effective: boolean,
): void {
	const textStr = effective ? `-${damage}` : `-${damage} RESISTIU (25%)`;
	const color: [number, number, number] = effective
		? [255, 235, 95]
		: [165, 175, 190];
	const fontSize = effective ? 15 : 12;

	const label = k.add([
		k.text(textStr, { size: fontSize }),
		k.pos(x, y),
		k.anchor("center"),
		k.color(...color),
		k.opacity(1),
		k.z(35),
	]);

	let elapsed = 0;
	label.onUpdate(() => {
		const dt = k.dt();
		elapsed += dt;
		label.pos.y -= 36 * dt;
		label.opacity = Math.max(0, 1 - elapsed / 0.75);
		if (elapsed >= 0.75) {
			label.destroy();
		}
	});
}

/** Applies damage to a combat target, emits combat:hit, and spawns floating visual feedback. */
export function applyHitToTarget(
	target: CombatTarget,
	weaponEra: Era | "universal",
	baseDamage: number,
): { damage: number; effective: boolean } {
	if (!target.exists() || target.hp <= 0) {
		return { damage: 0, effective: false };
	}

	const { damage, effective } = computeDamage(weaponEra, target.era, baseDamage);
	target.hp = Math.max(0, target.hp - damage);

	if (effective) {
		k.shake(3);
	}

	const feedbackY = target.pos.y - (target.height ?? 40) - 16;
	spawnDamageFeedback(target.pos.x, feedbackY, damage, effective);

	const gameTarget = target as unknown as {
		trigger?: (event: string, ...args: unknown[]) => void;
	};
	if (typeof gameTarget.trigger === "function") {
		gameTarget.trigger("combat:hit", { damage, effective, weaponEra });
	} else {
		k.trigger("combat:hit", "combatTarget", target, {
			damage,
			effective,
			weaponEra,
		});
	}
	target.onDamaged?.(damage, effective);

	return { damage, effective };
}

function performMeleeSlash(
	player: WeaponHost,
	range: number,
	baseDamage: number,
	weaponEra: Era | "universal",
): void {
	const facing = player.getFacing();
	const hitIds = new Set<number>();
	const slashHeight = weaponEra === "universal" ? 44 : 34;

	const hitbox = k.add([
		k.pos(player.pos.x + facing * (range / 2 + 10), player.pos.y - 22),
		k.anchor("center"),
		k.area({
			shape: new k.Rect(
				k.vec2(-range / 2, -slashHeight / 2),
				range,
				slashHeight,
			),
		}),
		k.z(16),
		"playerMelee",
	]);

	const clawMarks =
		weaponEra === "universal"
			? [-12, 0, 12].map((offsetY) =>
					hitbox.add([
						k.rect(range * 0.88, 5, { radius: 2 }),
						k.pos(0, offsetY),
						k.anchor("center"),
						k.rotate(facing * -20),
						k.color(255, 225, 235),
						k.opacity(0.95),
					]),
				)
			: [];

	hitbox.onCollide("combatTarget", (obj: GameObj) => {
		const target = obj as unknown as CombatTarget;
		const targetId = target.id ?? -1;
		if (targetId !== -1 && hitIds.has(targetId)) {
			return;
		}
		if (targetId !== -1) {
			hitIds.add(targetId);
		}
		applyHitToTarget(target, weaponEra, baseDamage);
	});

	let elapsed = 0;
	const duration = 0.12;
	hitbox.onUpdate(() => {
		const dt = k.dt();
		elapsed += dt;
		if (player.exists()) {
			const currentFacing = player.getFacing();
			hitbox.pos.x = player.pos.x + currentFacing * (range / 2 + 10);
			hitbox.pos.y = player.pos.y - 22;
		}
		const fade = Math.max(0, 1 - elapsed / duration);
		for (const mark of clawMarks) {
			mark.opacity = 0.95 * fade;
		}
		if (elapsed >= duration) {
			hitbox.destroy();
		}
	});
}

/** Registers weapon switching (1/2/3) and attack execution (H) for the given player instance. */
export function setupWeaponControls(player: WeaponHost): void {
	let cooldownTimer = 0;

	const selectWeapon = (weaponId: WeaponId): void => {
		if (!player.exists() || player.isBusy()) return;
		if (state.activeWeapon !== weaponId) {
			state.activeWeapon = weaponId;
			k.trigger("weapon:changed", "player", weaponId);
		}
	};

	k.onKeyPress(KEYS.WEAPON_1, () => selectWeapon("w1"));
	k.onKeyPress(KEYS.WEAPON_2, () => selectWeapon("w2"));
	k.onKeyPress(KEYS.WEAPON_3, () => selectWeapon("w3"));

	k.onUpdate(() => {
		if (cooldownTimer > 0) {
			cooldownTimer = Math.max(0, cooldownTimer - k.dt());
		}
	});

	k.onKeyPress(KEYS.ATTACK, () => {
		if (!player.exists() || player.isBusy() || cooldownTimer > 0) {
			return;
		}

		k.trigger("player:attack", "player");

		if (state.transformed) {
			cooldownTimer = WEREWOLF_COOLDOWN;
			performMeleeSlash(
				player,
				WEREWOLF_RANGE,
				WEREWOLF_DAMAGE,
				"universal",
			);
			return;
		}

		const weapon = WEAPONS[state.activeWeapon];
		cooldownTimer = weapon.cooldown;

		if (weapon.kind === "melee") {
			performMeleeSlash(
				player,
				weapon.range,
				weapon.damage,
				weapon.era,
			);
		} else {
			const facing = player.getFacing();
			const spriteName =
				weapon.id === "w2"
					? "bullet"
					: weapon.id === "w3"
						? "plasma"
						: undefined;
			const spawnXOffset = weapon.id === "w3" ? 34 : 28;
			const spawnYOffset = weapon.id === "w3" ? 34 : 40;
			spawnPlayerProjectile({
				pos: k.vec2(
					player.pos.x + facing * spawnXOffset,
					player.pos.y - spawnYOffset,
				),
				dir: facing,
				speed: weapon.projectileSpeed ?? 620,
				range: weapon.range,
				baseDamage: weapon.damage,
				weaponEra: weapon.era,
				piercing: Boolean(weapon.piercing),
				color: weapon.color,
				spriteName,
				onHit: applyHitToTarget,
			});
		}
	});
}
