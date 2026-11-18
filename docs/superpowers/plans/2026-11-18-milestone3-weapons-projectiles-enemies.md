# Milestone 3: Sistema de Armas, Projéteis & Inimigos por Era Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o loop central de combate do Milestone 3: as 3 armas por Era (`1/2/3` + ataque em `H`), projéteis (normais, perfurantes e de inimigos), cálculo de dano por Era (`1.0x` vs `0.25x` com feedback visual `"RESISTIU (25%)"`) e os 6 tipos de inimigos instanciados dinamicamente por Era a partir do checkpoint atual.

**Architecture:** Dados puros de armas e inimigos vivem em `src/data/weapons.ts` e `src/data/enemies.ts` sem dependências de lógica. O sistema `src/systems/weaponSystem.ts` centraliza a troca de armas (`1/2/3`), o disparo/golpe (`H`) e a regra de dano por Era (`computeDamage` / `applyHitToTarget`), comunicando-se por eventos do Kaplay (`"weapon:changed"`, `"combat:hit"`, `"combat:kill"`) e pela tag `"combatTarget"`. As factories `src/entities/projectile.ts` e `src/entities/enemy.ts` criam os objetos de jogo no Kaplay, e `src/systems/spawner.ts` popula a fase (`src/scenes/stage.ts`) conforme `state.currentEra` e `state.checkpointId`.

**Tech Stack:** TypeScript (`strict: true`), Kaplay (`^3001.0.19`, `global: false`), Vite.

## Global Constraints

- Instância única do Kaplay em `src/core/k.ts` (`global: false`). Sempre `import { k } from "../core/k"`.
- TypeScript `strict: true`, sem `any`.
- Identificadores, nomes de arquivo e comentários em inglês; textos de UI/feedback ao jogador em português (PT-BR).
- `src/data/` não importa nada de `scenes/`, `systems/` ou `entities/`.
- Multiplicador de dano na Era errada usa `WRONG_ERA_MULT = 0.25` de `src/core/constants.ts`; transformado em lobisomem (`state.transformed === true`) ou `weaponEra === "universal"` causa `1.0x`.
- `npx tsc --noEmit` deve passar limpo ao final de cada task.

---

### Task 1: Tabelas de Dados das 3 Armas e dos 6 Inimigos

**Files:**
- Create: `src/data/weapons.ts`
- Create: `src/data/enemies.ts`

**Interfaces:**
- Consumes: `Era`, `WeaponId`, `WeaponDef`, `EnemyDef` from `src/types/index.ts`
- Produces:
  - `WEAPONS: Record<WeaponId, WeaponDef>` in `src/data/weapons.ts`
  - `ENEMIES: Record<string, EnemyDef>` in `src/data/enemies.ts`

- [ ] **Step 1: Criar `src/data/weapons.ts` com as 3 armas (`w1`, `w2`, `w3`)**

```ts
import type { WeaponDef, WeaponId } from "../types";

export const WEAPONS: Record<WeaponId, WeaponDef> = {
	w1: {
		id: "w1",
		name: "Lâmina Ancestral",
		key: "1",
		era: "past",
		kind: "melee",
		damage: 25,
		cooldown: 0.32,
		range: 52,
		piercing: true,
		color: [242, 178, 76],
	},
	w2: {
		id: "w2",
		name: "Pistola Tática",
		key: "2",
		era: "present",
		kind: "projectile",
		damage: 18,
		cooldown: 0.28,
		range: 420,
		projectileSpeed: 620,
		piercing: false,
		color: [110, 196, 255],
	},
	w3: {
		id: "w3",
		name: "Canhão de Plasma",
		key: "3",
		era: "future",
		kind: "projectile",
		damage: 22,
		cooldown: 0.45,
		range: 520,
		projectileSpeed: 760,
		piercing: true,
		color: [0, 255, 224],
	},
};
```

- [ ] **Step 2: Criar `src/data/enemies.ts` com os 6 inimigos (2 por Era)**

```ts
import type { EnemyDef } from "../types";

export const ENEMIES: Record<string, EnemyDef> = {
	past_grunt: {
		id: "past_grunt",
		name: "Guerreiro Tribal",
		era: "past",
		hp: 40,
		speed: 120,
		contactDamage: 1,
		behavior: "patrol",
		width: 26,
		height: 38,
		color: [214, 132, 56],
	},
	past_brute: {
		id: "past_brute",
		name: "Brutamontes Ancestral",
		era: "past",
		hp: 75,
		speed: 95,
		contactDamage: 1,
		behavior: "chase",
		width: 36,
		height: 48,
		color: [184, 78, 42],
	},
	present_shooter: {
		id: "present_shooter",
		name: "Atirador Tático",
		era: "present",
		hp: 45,
		speed: 80,
		contactDamage: 1,
		behavior: "shoot",
		width: 26,
		height: 42,
		color: [90, 165, 235],
	},
	present_drone: {
		id: "present_drone",
		name: "Drone de Patrulha",
		era: "present",
		hp: 35,
		speed: 130,
		contactDamage: 1,
		behavior: "fly",
		width: 28,
		height: 22,
		color: [140, 210, 255],
	},
	future_stalker: {
		id: "future_stalker",
		name: "Perseguidor Cibernético",
		era: "future",
		hp: 50,
		speed: 165,
		contactDamage: 1,
		behavior: "chase",
		width: 26,
		height: 40,
		color: [0, 230, 195],
	},
	future_turret: {
		id: "future_turret",
		name: "Sentinela de Plasma",
		era: "future",
		hp: 70,
		speed: 60,
		contactDamage: 1,
		behavior: "shoot",
		width: 32,
		height: 44,
		color: [175, 95, 255],
	},
};
```

- [ ] **Step 3: Validar tipagem com TypeScript**

Run: `npx tsc --noEmit`
Expected: Exit code `0` sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/data/weapons.ts src/data/enemies.ts
git commit -m "feat: add weapons and enemies data tables for milestone 3"
```

---

### Task 2: Sistema de Armas, Dano por Era e Entidade de Projéteis

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/systems/weaponSystem.ts`
- Create: `src/entities/projectile.ts`

**Interfaces:**
- Consumes: `WEAPONS` from `src/data/weapons.ts`, `KEYS`, `WRONG_ERA_MULT`, `WEREWOLF_COOLDOWN`, `WEREWOLF_DAMAGE`, `WEREWOLF_RANGE` from `src/core/constants.ts`, `state` from `src/core/state.ts`
- Produces:
  - `CombatTarget` and `WeaponHost` in `src/types/index.ts`
  - `computeDamage(weaponEra: Era | "universal", targetEra: Era, baseDamage: number): { damage: number; effective: boolean }` in `src/systems/weaponSystem.ts`
  - `applyHitToTarget(target: CombatTarget, weaponEra: Era | "universal", baseDamage: number): { damage: number; effective: boolean }` in `src/systems/weaponSystem.ts`
  - `setupWeaponControls(player: WeaponHost): void` in `src/systems/weaponSystem.ts`
  - `spawnPlayerProjectile(opts: PlayerProjectileOpts)` and `spawnEnemyProjectile(opts: EnemyProjectileOpts)` in `src/entities/projectile.ts`

- [ ] **Step 1: Adicionar interfaces `CombatTarget` e `WeaponHost` em `src/types/index.ts`**

Adicionar ao final de `src/types/index.ts`:

```ts
export interface CombatTarget {
	id?: number;
	pos: { x: number; y: number };
	height?: number;
	era: Era;
	hp: number;
	maxHp: number;
	exists(): boolean;
	onDamaged?(damage: number, effective: boolean): void;
}

export interface WeaponHost {
	pos: { x: number; y: number };
	getFacing(): 1 | -1;
	isBusy(): boolean;
	exists(): boolean;
}
```

- [ ] **Step 2: Criar `src/entities/projectile.ts` com projéteis do player e de inimigos**

```ts
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
		proj.destroy();
	});

	proj.onCollide("combatTarget", (obj: GameObj) => {
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
		proj.destroy();
	});

	proj.onCollide("player", (playerObj: GameObj) => {
		const target = playerObj as GameObj & { takeDamage?: (amount: number) => void };
		target.takeDamage?.(opts.damage);
		proj.destroy();
	});

	return proj;
}
```

- [ ] **Step 3: Criar `src/systems/weaponSystem.ts` com `computeDamage`, `applyHitToTarget` e `setupWeaponControls`**

```ts
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

	const feedbackY = target.pos.y - (target.height ?? 40) - 16;
	spawnDamageFeedback(target.pos.x, feedbackY, damage, effective);

	k.trigger("combat:hit", target, { damage, effective, weaponEra });
	target.onDamaged?.(damage, effective);

	return { damage, effective };
}

function performMeleeSlash(
	player: WeaponHost,
	range: number,
	baseDamage: number,
	weaponEra: Era | "universal",
	color: [number, number, number],
): void {
	const facing = player.getFacing();
	const hitIds = new Set<number>();
	const slashHeight = weaponEra === "universal" ? 44 : 34;

	const hitbox = k.add([
		k.rect(range, slashHeight, { radius: 4 }),
		k.pos(player.pos.x + facing * (range / 2 + 10), player.pos.y - 22),
		k.anchor("center"),
		k.area(),
		k.color(...color),
		k.opacity(0.65),
		k.z(16),
		"playerMelee",
	]);

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
		hitbox.opacity = Math.max(0, 0.65 * (1 - elapsed / duration));
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
			k.trigger("weapon:changed", weaponId);
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

		if (state.transformed) {
			cooldownTimer = WEREWOLF_COOLDOWN;
			performMeleeSlash(
				player,
				WEREWOLF_RANGE,
				WEREWOLF_DAMAGE,
				"universal",
				[255, 75, 110],
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
				weapon.color,
			);
		} else {
			const facing = player.getFacing();
			spawnPlayerProjectile({
				pos: k.vec2(player.pos.x + facing * 20, player.pos.y - 24),
				dir: facing,
				speed: weapon.projectileSpeed ?? 620,
				range: weapon.range,
				baseDamage: weapon.damage,
				weaponEra: weapon.era,
				piercing: Boolean(weapon.piercing),
				color: weapon.color,
				onHit: applyHitToTarget,
			});
		}
	});
}
```

- [ ] **Step 4: Validar tipagem com TypeScript**

Run: `npx tsc --noEmit`
Expected: Exit code `0` sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/entities/projectile.ts src/systems/weaponSystem.ts
git commit -m "feat: add projectile entity and weapon system with era damage multiplier"
```

---

### Task 3: Factory de Inimigos e Spawner por Era

**Files:**
- Create: `src/entities/enemy.ts`
- Create: `src/systems/spawner.ts`

**Interfaces:**
- Consumes: `EnemyDef`, `Era`, `StageDef` from `src/types/index.ts`, `ENEMIES` from `src/data/enemies.ts`, `ERAS` from `src/data/eras.ts`, `spawnEnemyProjectile` from `src/entities/projectile.ts`
- Produces:
  - `makeEnemy(def: EnemyDef, spawnPos: Vec2): GameObj` in `src/entities/enemy.ts`
  - `spawnStageEnemies(stageDef: StageDef, currentEra: Era): GameObj[]` in `src/systems/spawner.ts`

- [ ] **Step 1: Criar `src/entities/enemy.ts` com os 4 comportamentos (`patrol`, `chase`, `fly`, `shoot`), barra de HP e flash de dano**

```ts
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
					k.trigger("combat:kill", enemy);
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
	enemy.onCollideUpdate("player", damagePlayerOnTouch);

	const getPlayer = (): GameObj | null => {
		const players = k.get("player");
		return players.length > 0 ? players[0] : null;
	};

	const behaviors: Record<EnemyDef["behavior"], (dt: number) => void> = {
		patrol: () => {
			enemy.move(dir * def.speed, 0);
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
				enemy.move(dir * def.speed, 0);
			} else {
				enemy.move(dir * (def.speed * 0.6), 0);
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
```

- [ ] **Step 2: Criar `src/systems/spawner.ts` com `spawnStageEnemies`**

```ts
import type { GameObj } from "kaplay";
import { k } from "../core/k";
import { state } from "../core/state";
import { ENEMIES } from "../data/enemies";
import { ERAS } from "../data/eras";
import { makeEnemy } from "../entities/enemy";
import type { Era, StageDef } from "../types";

/** Spawns stage enemies for the active era at or ahead of the current checkpoint. */
export function spawnStageEnemies(stageDef: StageDef, currentEra: Era): GameObj[] {
	const pool = ERAS[currentEra].enemyPool;
	const spawned: GameObj[] = [];

	for (const spawn of stageDef.spawns) {
		if (spawn.checkpointGroup < state.checkpointId) {
			continue;
		}

		const enemyId = pool[spawn.poolIndex];
		const enemyDef = ENEMIES[enemyId];
		if (!enemyDef) {
			continue;
		}

		const worldPos = k.vec2(
			spawn.tx * stageDef.tileWidth + stageDef.tileWidth / 2,
			spawn.ty * stageDef.tileHeight,
		);
		spawned.push(makeEnemy(enemyDef, worldPos));
	}

	return spawned;
}
```

- [ ] **Step 3: Validar tipagem com TypeScript**

Run: `npx tsc --noEmit`
Expected: Exit code `0` sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/entities/enemy.ts src/systems/spawner.ts
git commit -m "feat: add enemy factory and era-aware stage spawner"
```

---

### Task 4: Integração no Player e na Cena Stage

**Files:**
- Modify: `src/entities/player.ts`
- Modify: `src/scenes/stage.ts`

**Interfaces:**
- Consumes: `setupWeaponControls` from `src/systems/weaponSystem.ts`, `spawnStageEnemies` from `src/systems/spawner.ts`, `WEAPONS` from `src/data/weapons.ts`
- Produces:
  - Player com métodos `getFacing()`, `isBusy()`, `onBeforePhysicsResolve` ignorando objetos não-plataforma (permitindo atravessar inimigos no Dash `J`), e controles de armas registrados (`1/2/3`, `H`)
  - Cena `stage` instanciando os inimigos da Era ativa via `spawnStageEnemies(STAGE_1, state.currentEra)` e exibindo a arma equipada no HUD temporário

- [ ] **Step 1: Atualizar `src/entities/player.ts` para expor `getFacing`/`isBusy`, ignorar colisão sólida com inimigos e ativar `setupWeaponControls`**

Substituir o bloco de criação do `player` e final de `src/entities/player.ts`:

```ts
// No topo de src/entities/player.ts, adicionar import:
import { setupWeaponControls } from "../systems/weaponSystem";
```

No objeto `player = k.add([...])` em `src/entities/player.ts`, adicionar `getFacing` e `isBusy`, além de `player.onBeforePhysicsResolve` e `setupWeaponControls(player)`:

```ts
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
			getFacing(): 1 | -1 {
				return facing;
			},
			isBusy(): boolean {
				return isDead || isDashing;
			},
		},
	]);

	player.onBeforePhysicsResolve((col) => {
		if (!col.target.is("platform")) {
			col.preventResolution();
		}
	});
```

E logo antes de `return player;` no final de `makePlayer`:

```ts
	setupWeaponControls(player);

	return player;
```

- [ ] **Step 2: Atualizar `src/scenes/stage.ts` para chamar `spawnStageEnemies` e mostrar a arma ativa no HUD**

Em `src/scenes/stage.ts`, importar `WEAPONS` e `spawnStageEnemies`:

```ts
import { WEAPONS } from "../data/weapons";
import { spawnStageEnemies } from "../systems/spawner";
```

Logo após `const player = makePlayer(spawnPos);` em `src/scenes/stage.ts`, instanciar os inimigos da Era:

```ts
		const player = makePlayer(spawnPos);
		spawnStageEnemies(STAGE_1, state.currentEra);
```

E atualizar `formatHudText` em `src/scenes/stage.ts`:

```ts
		const formatHudText = (): string => {
			const weapon = WEAPONS[state.activeWeapon];
			return `Era: ${config.label}  |  Arma: \\[${weapon.key}\\] ${weapon.name}  |  HP: ${state.hp}/${state.maxHp}  |  CP: ${state.checkpointId}  |  \\[1/2/3\\] Arma  \\[H\\] Atacar  \\[J\\] Dash`;
		};
```

- [ ] **Step 3: Validar tipagem e build de produção**

Run: `npx tsc --noEmit`
Expected: Exit code `0` sem erros.

Run: `npm run build`
Expected: Build do Vite concluído com sucesso em `dist/`.

- [ ] **Step 4: Commit**

```bash
git add src/entities/player.ts src/scenes/stage.ts
git commit -m "feat: wire weapon controls on player and spawn era enemies in stage"
```
