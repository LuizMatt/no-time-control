# Stage 1 Level Design Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Stage 1 (`STAGE_1`) to match the hand-drawn 5-zone level design sketch (Vertical Building 1 -> High Jump to Castle with CP1 -> 3 Suspended Platforms -> Bridge to Pre-Boss Mini-Room with CP2 -> Multi-Tier Boss Arena), reduce player max HP to 3, and set total checkpoints to 3 (`0`, `1`, `2`).

**Architecture:** Data-driven level layout update in `src/data/stages.ts` paired with a constant update in `src/core/constants.ts` (`PLAYER_MAX_HP = 3`, `FALL_DEATH_Y = 1200`) and checkpoint index clamp update in `src/scenes/stage.ts` (`Math.max(state.checkpointId, 2)`). No new runtime systems or dependencies are introduced.

**Tech Stack:** TypeScript (`strict: true`), Kaplay, Vite.

## Global Constraints

- TypeScript `strict: true`, no `any`, `npx tsc --noEmit` must pass with zero errors.
- All balancing values live in `src/core/constants.ts` or `src/data/*`.
- Every row in `STAGE_1.map` must have the exact same character length (`136` characters across `30` rows, `0..29`).
- Works identically across all 3 temporal eras (`past`, `present`, `future`).

---

### Task 1: Set Player Max HP to 3 and Update Boss Arena Checkpoint Index

**Files:**
- Modify: `src/core/constants.ts:5-20`
- Modify: `src/scenes/stage.ts:67-73`

**Interfaces:**
- Consumes: `PLAYER_MAX_HP`, `FALL_DEATH_Y` from `src/core/constants.ts`
- Produces: `PLAYER_MAX_HP = 3`, `FALL_DEATH_Y = 1200`, and boss arena checkpoint lock at `checkpointId = 2`

- [ ] **Step 1: Update `PLAYER_MAX_HP` and `FALL_DEATH_Y` in `src/core/constants.ts`**

Edit `src/core/constants.ts` so `PLAYER_MAX_HP` is `3` and `FALL_DEATH_Y` is `1200` (accommodating the 30-row stage height of `960px`):

```typescript
// Physics and movement
export const GRAVITY = 1400;
export const PLAYER_SPEED = 260;
export const JUMP_FORCE = 560;
export const FALL_DEATH_Y = 1200;

// Dash
export const DASH_SPEED = 680;
export const DASH_DURATION = 0.16;
export const DASH_COOLDOWN = 0.65;

// Combat and era multiplier
export const WRONG_ERA_MULT = 0.25;
export const PLAYER_MAX_HP = 3;
export const PLAYER_INVULN_TIME = 0.8;
```

- [ ] **Step 2: Update Boss Arena checkpoint lock in `src/scenes/stage.ts`**

In `src/scenes/stage.ts`, update `spawnBossArena` so entering the boss fight locks the player at checkpoint `2` (the new pre-Boss mini-room checkpoint) instead of `3`:

```typescript
		const spawnBossArena = (): void => {
			bossSpawned = true;
			state.bossActive = true;
			state.checkpointId = Math.max(state.checkpointId, 2);
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: PASS with zero output/errors.

---

### Task 2: Implement the 5-Zone Level Design in `src/data/stages.ts`

**Files:**
- Modify: `src/data/stages.ts:1-127`

**Interfaces:**
- Consumes: `StageDef` from `src/types`
- Produces: `STAGE_1` with 30 rows × 136 columns, 3 checkpoints (`0`, `1`, `2`), 5 enemy spawns matching the sketch's `c` markers, aligned decorative props, and `bossSpawn` on row `27`.

- [ ] **Step 1: Replace `STAGE_1` in `src/data/stages.ts` with the 5-zone layout**

Write the complete 30-row (`0..29`), 136-column (`0..135`) map, checkpoints, spawns, props, and bossSpawn in `src/data/stages.ts`:

```typescript
import type { StageDef } from "../types";

export const STAGE_1: StageDef = {
	tileWidth: 32,
	tileHeight: 32,
	map: [
		// 0         1         2         3         4         5         6         7         8         9         10        11        12        13
		// 0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345
		"#......................................................................................................................................#", // 0
		"#......................................................................................................................................#", // 1
		"#......................................................................................................................................#", // 2
		"#......................................................................................................................................#", // 3
		"#......................................................................................................................................#", // 4
		"#......................................................................................................#################################", // 5
		"#......................................................................................................#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB#", // 6
		"#......................................................................................................#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB#", // 7
		"#......................................................................................................#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB#", // 8
		"#......................................................................................................#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB#", // 9
		"#......................................................................................................#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB#", // 10
		"#......................................................................................................#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB#", // 11
		"#......................................................................................................#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB#", // 12
		"#..........-----##########.............................................................................#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB#", // 13
		"#..........#BBBBBBBBBBBBB#......-----##########........................................................#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB#", // 14
		"#..........#BBBBBB-----BB#......#BBBBBBBBBBBBB#........................................................#BBBB-----BBBB-----BBBB-----BBBB#", // 15
		"#..........#BBBBBBBBBBBBB#......#BBBBBBBBBBBBB#........................................................#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB#", // 16
		"#..........#BBBBBBBBBBBBB#......#BBBB-----BBBB#........................................................#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB#", // 17
		"#..........#BB------BBBBB#......#BBBBBBBBBBBBB#........................................................#BBBBBBBB-----BBBBBB-----BBBBBBB#", // 18
		"#..........#BBBBBBBBBBBBB#......#BBBBBBBBBBBBB#........................................................#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB#", // 19
		"#..........#BBBBBBBBBBBBB#......#BBBBBBBB-----#...........------.......................................#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB#", // 20
		"#..........#BBBBBB------B#......#BBBBBBBBBBBBB#.............................................############BBBB-----BBBB-----BBBB-----BBBB#", // 21
		"#..........#BBBBBBBBBBBBB#......#BBBBBBBBBBBBB#.............................................#BBBBBBBBBB#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB#", // 22
		"#..........#BBBBBBBBBBBBB#......#BB------BBBBB#....-----..........-----.....................#BBBBBBBBBB#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB#", // 23
		"#......----#BB-----BBBBBB#......#BBBBBBBBBBBBB#.............................................#BBBBBBBBBB#BBBBBBBB-----BBBBBB-----BBBBBBB#", // 24
		"#..........BBBBBBBBBBBBBB#......#BBBBBBBBBBBBBB.............................................BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB#", // 25
		"#.....---..BBBBBBBBBBBBBB#......#BBBBBBBBBBBBBB...^^....^^......^^....^^....................BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB#", // 26
		"##########################....############################################...#############..############################################", // 27
		"##########################....############################################...#...........#..############################################", // 28
		"##########################....############################################...#...........#..############################################", // 29
	],
	checkpoints: [
		// CP0: Initial spawn at the bottom-left before climbing Building 1 ("Montanha / Prédio / Vielas")
		{ id: 0, tx: 3, ty: 27 },
		// CP1 ("X" in sketch): Top-left entrance ledge of the Castle after the high jump ("Pulo")
		{ id: 1, tx: 34, ty: 14 },
		// CP2: Safe Pre-Boss Mini-Room right after crossing the Bridge ("Ponte")
		{ id: 2, tx: 97, ty: 27 },
	],
	spawns: [
		// Zone 1 ("Montanha / Prédio / Vielas"): 2 enemies inside the vertical climb
		{ tx: 15, ty: 24, poolIndex: 0, checkpointGroup: 0 },
		{ tx: 15, ty: 18, poolIndex: 1, checkpointGroup: 0 },
		// Zone 2 ("Castelo"): 1 enemy inside the Castle descent
		{ tx: 39, ty: 17, poolIndex: 0, checkpointGroup: 1 },
		// Zone 3 (3 Suspended Platforms): 1 enemy on the middle high platform
		{ tx: 60, ty: 20, poolIndex: 1, checkpointGroup: 1 },
		// Zone 5 (Boss Tower / Arena lower floor): 1 enemy near the entrance
		{ tx: 110, ty: 27, poolIndex: 0, checkpointGroup: 2 },
	],
	props: [
		// Zone 1: "Montanha / Prédio / Vielas futuristas" vertical climb
		{ tx: 16, ty: 12, kind: "railingLeft" },
		{ tx: 17, ty: 12, kind: "railingMid" },
		{ tx: 18, ty: 12, kind: "railingRight" },
		{ tx: 14, ty: 14, kind: "banner" },
		{ tx: 18, ty: 14, kind: "ceilingWires" },
		{ tx: 22, ty: 14, kind: "bannerAlt" },
		{ tx: 14, ty: 16, kind: "window" },
		{ tx: 21, ty: 16, kind: "window" },
		{ tx: 18, ty: 19, kind: "light" },
		{ tx: 14, ty: 22, kind: "window" },
		{ tx: 21, ty: 22, kind: "light" },
		{ tx: 14, ty: 26, kind: "bookshelf" },
		{ tx: 19, ty: 26, kind: "portal" },
		{ tx: 23, ty: 26, kind: "crateStack" },

		// Zone 2: "Castelo" (with CP1 at top-left)
		{ tx: 38, ty: 13, kind: "railingLeft" },
		{ tx: 39, ty: 13, kind: "railingMid" },
		{ tx: 40, ty: 13, kind: "railingRight" },
		{ tx: 36, ty: 15, kind: "banner" },
		{ tx: 42, ty: 15, kind: "ceilingWires" },
		{ tx: 36, ty: 19, kind: "window" },
		{ tx: 42, ty: 19, kind: "light" },
		{ tx: 36, ty: 26, kind: "brazier" },
		{ tx: 40, ty: 26, kind: "arch" },
		{ tx: 44, ty: 26, kind: "door" },

		// Zone 3: 3 Suspended Platforms trench
		{ tx: 49, ty: 26, kind: "brazier" },
		{ tx: 55, ty: 26, kind: "tower" },
		{ tx: 65, ty: 26, kind: "tower" },
		{ tx: 71, ty: 26, kind: "brazier" },

		// Zone 4: "Ponte" (Bridge over the chasm) + Pre-Boss Mini-Room (CP2)
		{ tx: 77, ty: 26, kind: "brazier" },
		{ tx: 80, ty: 26, kind: "arch" },
		{ tx: 86, ty: 26, kind: "arch" },
		{ tx: 89, ty: 26, kind: "brazier" },
		{ tx: 94, ty: 22, kind: "banner" },
		{ tx: 97, ty: 22, kind: "ceilingWires" },
		{ tx: 100, ty: 22, kind: "bannerAlt" },
		{ tx: 95, ty: 24, kind: "window" },
		{ tx: 99, ty: 24, kind: "light" },
		{ tx: 94, ty: 26, kind: "crateStack" },
		{ tx: 101, ty: 26, kind: "brazier" },

		// Zone 5: Multi-Tier Boss Arena ("Chefe")
		{ tx: 107, ty: 6, kind: "banner" },
		{ tx: 109, ty: 6, kind: "ceilingWires" },
		{ tx: 113, ty: 6, kind: "cage" },
		{ tx: 116, ty: 6, kind: "bannerAlt" },
		{ tx: 120, ty: 6, kind: "ceilingWires" },
		{ tx: 124, ty: 6, kind: "bannerAlt" },
		{ tx: 127, ty: 6, kind: "cage" },
		{ tx: 130, ty: 6, kind: "ceilingWires" },
		{ tx: 132, ty: 6, kind: "banner" },
		{ tx: 109, ty: 11, kind: "window" },
		{ tx: 116, ty: 11, kind: "window" },
		{ tx: 123, ty: 11, kind: "window" },
		{ tx: 130, ty: 11, kind: "window" },
		{ tx: 112, ty: 16, kind: "light" },
		{ tx: 120, ty: 16, kind: "light" },
		{ tx: 127, ty: 16, kind: "light" },
		{ tx: 106, ty: 26, kind: "brazier" },
		{ tx: 112, ty: 26, kind: "arch" },
		{ tx: 120, ty: 26, kind: "portal" },
		{ tx: 126, ty: 26, kind: "arch" },
		{ tx: 131, ty: 26, kind: "brazier" },
		{ tx: 133, ty: 26, kind: "door" },
	],
	bossSpawn: {
		tx: 126,
		ty: 27,
		triggerTx: 105,
	},
};
```

- [ ] **Step 2: Verify row lengths and TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: PASS with zero errors.

---

### Task 3: End-to-End Verification in Dev Server

**Files:**
- Modify: none (verification task)

- [ ] **Step 1: Verify row consistency and reachability**

Run a quick node one-liner or check that all 30 rows in `STAGE_1.map` have length `136`, all checkpoints/spawns/bossSpawn sit above solid `#` or one-way `-` tiles, and `npx tsc --noEmit` succeeds.
