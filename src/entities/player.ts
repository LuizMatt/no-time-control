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
import { shouldResolvePlatformCollision } from "../core/physics";
import { prepareCheckpointRespawn, state } from "../core/state";
import { pickDifferentEra } from "../systems/eraDirector";
import { setupWeaponControls } from "../systems/weaponSystem";

const BASE_SCALE = 2;
const WEREWOLF_SCALE_X = 2;
const WEREWOLF_SCALE_Y = 2;

/** Creates the player entity with movement, jump, dash, i-frames, and temporal respawn on death. */
export function makePlayer(spawnPos: Vec2, fallDeathY = FALL_DEATH_Y) {
	let facing: 1 | -1 = 1;
	let isDashing = false;
	let dashTimer = 0;
	let dashCooldownTimer = 0;
	let invulnTimer = 0;
	let afterimageTimer = 0;
	let attackAnimTimer = 0;
	let isDead = false;
	type AttackAnim = "attack" | "attack_pistol" | "attack_plasma";
	type PlayerAnim =
		| "idle"
		| "run"
		| "jump"
		| "fall"
		| AttackAnim
		| "dash"
		| "death";
	let currentAnim: PlayerAnim = "idle";
	let currentAttackAnim: AttackAnim = "attack";

	function resolveAttackAnim(): { anim: AttackAnim; duration: number } {
		if (state.transformed || state.activeWeapon === "w1") {
			return { anim: "attack", duration: 0.36 };
		}
		if (state.activeWeapon === "w2") {
			return { anim: "attack_pistol", duration: 0.3 };
		}
		return { anim: "attack_plasma", duration: 0.4 };
	}

	function playAnim(anim: PlayerAnim): void {
		if (currentAnim === anim) return;
		currentAnim = anim;
		player.play(anim);
	}

	function triggerPlayerDeath(instant = false): void {
		if (isDead) return;
		isDead = true;
		isDashing = false;
		player.vel.x = 0;
		player.opacity = 1;
		aura.opacity = 0;

		if (instant) {
			const nextEra = pickDifferentEra(state.currentEra);
			prepareCheckpointRespawn(nextEra);
			k.go("stage");
			return;
		}

		playAnim("death");
		k.wait(0.85, () => {
			const nextEra = pickDifferentEra(state.currentEra);
			prepareCheckpointRespawn(nextEra);
			k.go("stage");
		});
	}

	const player = k.add([
		k.sprite("player", { anim: "idle" }),
		k.pos(spawnPos),
		k.area({ shape: new k.Rect(k.vec2(-1, -1), 14, 29) }),
		k.body(),
		k.anchor("bot"),
		k.scale(BASE_SCALE),
		k.color(255, 255, 255),
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
					triggerPlayerDeath(false);
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
		if (!shouldResolvePlatformCollision(col)) {
			col.preventResolution();
		}
	});

	const aura = player.add([
		k.rect(24, 34, { radius: 5 }),
		k.pos(0, 2),
		k.anchor("bot"),
		k.color(255, 75, 110),
		k.opacity(0),
		k.z(-1),
	]);

	function applyTransformVisual(transformed: boolean): void {
		if (!player.exists()) return;
		if (transformed) {
			player.color = k.rgb(255, 130, 155);
			player.scale = k.vec2(WEREWOLF_SCALE_X, WEREWOLF_SCALE_Y);
		} else {
			player.color = k.rgb(255, 255, 255);
			player.scale = k.vec2(BASE_SCALE, BASE_SCALE);
			aura.opacity = 0;
		}
	}

	player.on("transform:start", () => applyTransformVisual(true));
	player.on("transform:end", () => applyTransformVisual(false));
	player.on("player:attack", () => {
		if (!isDead && !isDashing) {
			const { anim, duration } = resolveAttackAnim();
			attackAnimTimer = duration;
			currentAttackAnim = anim;
			currentAnim = anim;
			player.play(anim);
		}
	});
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
			playAnim("dash");
		}
	});

	player.onUpdate(() => {
		if (isDead) return;

		const dt = k.dt();
		dashCooldownTimer = Math.max(0, dashCooldownTimer - dt);
		invulnTimer = Math.max(0, invulnTimer - dt);
		attackAnimTimer = Math.max(0, attackAnimTimer - dt);

		if (isDashing) {
			dashTimer -= dt;
			player.vel.y = 0;
			player.move(facing * DASH_SPEED, 0);

			afterimageTimer -= dt;
			if (afterimageTimer <= 0) {
				afterimageTimer = 0.04;
				const ghostColor: [number, number, number] = state.transformed
					? [255, 95, 130]
					: [180, 220, 255];
				const ghost = k.add([
					k.sprite("player", { frame: player.frame }),
					k.pos(player.pos),
					k.anchor("bot"),
					k.scale(player.scale),
					k.color(...ghostColor),
					k.opacity(0.45),
					k.z(9),
				]);
				ghost.flipX = player.flipX;
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
				player.flipX = facing === -1;
				const speed = PLAYER_SPEED * (state.transformed ? WEREWOLF_SPEED_MULT : 1);
				player.move(dir * speed, 0);
			}

			if (attackAnimTimer > 0) {
				playAnim(currentAttackAnim);
			} else if (!player.isGrounded()) {
				playAnim(player.vel.y < 0 ? "jump" : "fall");
			} else if (dir !== 0) {
				playAnim("run");
			} else {
				playAnim("idle");
			}
		}

		if (state.transformed) {
			aura.opacity = 0.25 + 0.18 * Math.sin(k.time() * 14);
		}

		if (invulnTimer > 0 && !isDashing) {
			const flashHit = invulnTimer > PLAYER_INVULN_TIME - 0.15;
			if (flashHit) {
				player.color = k.rgb(245, 220, 155);
				player.opacity = 1;
			} else {
				player.color = state.transformed
					? k.rgb(255, 130, 155)
					: k.rgb(255, 255, 255);
				player.opacity = Math.floor(k.time() * 20) % 2 === 0 ? 0.4 : 1;
			}
		} else {
			player.color = state.transformed
				? k.rgb(255, 130, 155)
				: k.rgb(255, 255, 255);
			player.opacity = 1;
		}

		if (player.pos.y > fallDeathY) {
			triggerPlayerDeath(true);
		}
	});

	setupWeaponControls(player);

	return player;
}
