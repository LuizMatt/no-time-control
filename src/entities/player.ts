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
	WEREWOLF_SPEED_MULT,
} from "../core/constants";
import { k } from "../core/k";
import { prepareCheckpointRespawn, state } from "../core/state";
import { pickDifferentEra } from "../systems/eraDirector";

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
		},
	]);

	const indicator = player.add([
		k.rect(8, 6),
		k.pos(8, -32),
		k.anchor("center"),
		k.color(40, 50, 70),
	]);

	player.onCollideUpdate((obj) => {
		if (obj.is("hazard")) {
			player.takeDamage(1);
		}
	});

	k.onKeyPress(KEYS.JUMP, () => {
		if (!isDead && !isDashing && player.isGrounded()) {
			player.jump(JUMP_FORCE);
		}
	});

	k.onKeyPress(KEYS.DASH, () => {
		if (!isDead && !isDashing && dashCooldownTimer <= 0) {
			isDashing = true;
			dashTimer = DASH_DURATION;
			dashCooldownTimer = DASH_COOLDOWN;
			invulnTimer = Math.max(invulnTimer, DASH_DURATION);
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
				const ghost = k.add([
					k.rect(28, 44),
					k.pos(player.pos),
					k.anchor("bot"),
					k.color(180, 210, 255),
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

		if (invulnTimer > 0 && !isDashing) {
			player.opacity = Math.floor(k.time() * 20) % 2 === 0 ? 0.4 : 1;
		} else {
			player.opacity = 1;
		}

		if (player.pos.y > FALL_DEATH_Y) {
			triggerPlayerDeath();
		}
	});

	return player;
}
