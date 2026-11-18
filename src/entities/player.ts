import type { Vec2 } from "kaplay";
import {
	DASH_COOLDOWN,
	DASH_DURATION,
	DASH_SPEED,
	FALL_DEATH_Y,
	JUMP_FORCE,
	KEYS,
	PLAYER_INVULN_TIME,
	PLAYER_SPEED,
	WEREWOLF_JUMP_MULT,
	WEREWOLF_SPEED_MULT,
} from "../core/constants";
import { k } from "../core/k";
import { prepareCheckpointRespawn, state } from "../core/state";
import { pickDifferentEra } from "../systems/eraDirector";
import { setupWeaponControls } from "../systems/weaponSystem";

/** Creates the player entity with movement, jump, dash, i-frames, and temporal respawn on death. */
export function makePlayer(spawnPos: Vec2) {
	let facing: 1 | -1 = 1;
	let isDashing = false;
	let dashTimer = 0;
	let dashCooldownTimer = 0;
	let invulnTimer = 0;
	let afterimageTimer = 0;
	let isDead = false;

	function triggerPlayerDeath(): void {
		if (isDead) return;
		isDead = true;
		const nextEra = pickDifferentEra(state.currentEra);
		prepareCheckpointRespawn(nextEra);
		k.go("stage");
	}

	const player = k.add([
		k.rect(28, 44),
		k.pos(spawnPos),
		k.area(),
		k.body(),
		k.anchor("bot"),
		k.scale(1),
		k.color(235, 240, 250),
		k.opacity(1),
		k.z(10),
		"player",
		{
			takeDamage(amount: number): void {
				if (isDead || invulnTimer > 0 || isDashing) return;
				state.hp = Math.max(0, state.hp - amount);
				invulnTimer = PLAYER_INVULN_TIME;
				k.trigger("player:hurt", "player");
				if (state.hp <= 0) {
					triggerPlayerDeath();
				}
			},
			getFacing(): 1 | -1 {
				return facing;
			},
			isBusy(): boolean {
				return isDead || isDashing;
			},
			isInvulnerable(): boolean {
				return isDead || invulnTimer > 0 || isDashing;
			},
		},
	]);

	player.onBeforePhysicsResolve((col) => {
		if (!col.target.is("platform")) {
			col.preventResolution();
		}
	});

	const aura = player.add([
		k.rect(38, 54, { radius: 6 }),
		k.pos(0, 4),
		k.anchor("bot"),
		k.color(255, 75, 110),
		k.opacity(0),
		k.z(-1),
	]);

	const indicator = player.add([
		k.rect(8, 6),
		k.pos(8, -32),
		k.anchor("center"),
		k.color(40, 50, 70),
	]);

	function applyTransformVisual(transformed: boolean): void {
		if (!player.exists()) return;
		if (transformed) {
			player.color = k.rgb(220, 45, 85);
			player.scale = k.vec2(1.22, 1.25);
			indicator.color = k.rgb(255, 220, 120);
		} else {
			player.color = k.rgb(235, 240, 250);
			player.scale = k.vec2(1, 1);
			indicator.color = k.rgb(40, 50, 70);
			aura.opacity = 0;
		}
	}

	player.on("transform:start", () => applyTransformVisual(true));
	player.on("transform:end", () => applyTransformVisual(false));
	applyTransformVisual(state.transformed);

	player.onCollideUpdate((obj) => {
		if (obj.is("hazard")) {
			player.takeDamage(1);
		}
	});

	k.onKeyPress(KEYS.JUMP, () => {
		if (!isDead && !isDashing && player.isGrounded()) {
			const jumpForce = JUMP_FORCE * (state.transformed ? WEREWOLF_JUMP_MULT : 1);
			player.jump(jumpForce);
		}
	});

	k.onKeyPress(KEYS.DASH, () => {
		if (!isDead && !isDashing && dashCooldownTimer <= 0) {
			isDashing = true;
			dashTimer = DASH_DURATION;
			dashCooldownTimer = DASH_COOLDOWN;
			invulnTimer = Math.max(invulnTimer, DASH_DURATION + 0.06);
			afterimageTimer = 0;
		}
	});

	player.onUpdate(() => {
		if (isDead) return;

		const dt = k.dt();
		dashCooldownTimer = Math.max(0, dashCooldownTimer - dt);
		invulnTimer = Math.max(0, invulnTimer - dt);

		if (isDashing) {
			dashTimer -= dt;
			player.vel.y = 0;
			player.move(facing * DASH_SPEED, 0);

			afterimageTimer -= dt;
			if (afterimageTimer <= 0) {
				afterimageTimer = 0.04;
				const ghostColor: [number, number, number] = state.transformed
					? [255, 75, 110]
					: [180, 210, 255];
				const ghost = k.add([
					k.rect(28, 44),
					k.pos(player.pos),
					k.anchor("bot"),
					k.scale(player.scale),
					k.color(...ghostColor),
					k.opacity(0.45),
					k.z(9),
				]);
				ghost.onUpdate(() => {
					ghost.opacity -= (0.45 / 0.15) * k.dt();
					if (ghost.opacity <= 0) {
						ghost.destroy();
					}
				});
			}

			if (dashTimer <= 0) {
				isDashing = false;
			}
		} else {
			let dir = 0;
			if (k.isKeyDown(KEYS.LEFT)) dir -= 1;
			if (k.isKeyDown(KEYS.RIGHT)) dir += 1;

			if (dir !== 0) {
				facing = dir > 0 ? 1 : -1;
				indicator.pos.x = facing === 1 ? 8 : -8;
				const speed = PLAYER_SPEED * (state.transformed ? WEREWOLF_SPEED_MULT : 1);
				player.move(dir * speed, 0);
			}
		}

		if (state.transformed) {
			aura.opacity = 0.25 + 0.18 * Math.sin(k.time() * 14);
		}

		if (invulnTimer > 0 && !isDashing) {
			player.opacity = Math.floor(k.time() * 20) % 2 === 0 ? 0.4 : 1;
		} else {
			player.opacity = 1;
		}

		if (player.pos.y > FALL_DEATH_Y) {
			triggerPlayerDeath();
		}
	});

	setupWeaponControls(player);

	return player;
}
