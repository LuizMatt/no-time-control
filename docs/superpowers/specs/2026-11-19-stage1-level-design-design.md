# Stage 1 Level Design Overhaul — Design Spec

## Overview

Redesign `STAGE_1` in `src/data/stages.ts` to match the hand-drawn level design sketch while reducing player max HP to `3` and consolidating checkpoints to `3` total points (`id: 0` initial spawn, `id: 1` Castle top-left `X`, and `id: 2` pre-Boss mini-room).

## Requirements & Decisions

1. **Player Health (`PLAYER_MAX_HP = 3`)**:
   - Update `PLAYER_MAX_HP` in `src/core/constants.ts` from `5` to `3`.
   - `state.ts` and `hud.ts` automatically derive heart count and special bar width from `PLAYER_MAX_HP`.

2. **Checkpoints (`id: 0`, `id: 1`, `id: 2`)**:
   - `id: 0` (`tx: 3, ty: 27`): Initial spawn at the bottom-left entrance before the first building climb.
   - `id: 1` (`tx: 33, ty: 14`): Marked as `X` in the sketch — on the upper-left ledge of the Castle structure immediately after jumping across from the top of Building 1.
   - `id: 2` (`tx: 97, ty: 27`): Inside the safe pre-Boss mini-room right after crossing the Bridge and right before the Boss arena gate (`BOSS_GATE_TX = 103`).
   - Update `src/scenes/stage.ts` so `spawnBossArena()` locks checkpoint progress at `Math.max(state.checkpointId, 2)` instead of `3`.

3. **5-Zone Stage Geometry (`136 columns × 30 rows`, `32×32` tiles)**:
   - **Zone 1 — Opening Step + "Montanha / Prédio / Vielas Futuristas" (`tx: 1..27`)**:
     - Steps up from ground level (`ty: 27`) into a tall open-top vertical structure (`tx: 11..26`, `ty: 13..26`) filled with `B` interior walls and 4 staggered tiers of one-way platforms (`-`) on rows `24`, `21`, `18`, and `15`, plus a walkable top exit on row `13`.
     - Houses **2 enemies** (`checkpointGroup: 0`) on internal floors (`ty: 24` and `ty: 18`).
   - **Zone 2 — High Jump ("Pulo") + "Castelo" (`tx: 28..47`)**:
     - A 5-tile gap (`tx: 27..31`) separates the top of Zone 1 (`ty: 13`) from the top-left entrance ledge of the Castle (`tx: 32..36, ty: 14`), where **Checkpoint 1 (`X`)** sits at `tx: 33, ty: 14`.
     - The player descends/navigates through the Castle interior (`tx: 33..46, ty: 14..26`) across staggered platforms (`ty: 17, 20, 23`) with **1 enemy** (`checkpointGroup: 1`) on the mid floor, exiting at the bottom-right doorway (`ty: 25..26`).
   - **Zone 3 — 3 Suspended Platforms Crossing (`tx: 48..72`)**:
     - A hazard-floored trench (`ty: 26` spikes `^` and pit gaps) spanned by **3 suspended platforms** (`tx: 51..55` at `ty: 23`, `tx: 58..63` at `ty: 20`, and `tx: 66..70` at `ty: 23`).
     - Houses **1 enemy** (`checkpointGroup: 1`) on the central elevated platform (`tx: 60, ty: 20`).
   - **Zone 4 — The Bridge ("Ponte") + Pre-Boss Mini-Room (`tx: 73..103`)**:
     - A bridge deck (`ty: 27`, `tx: 75..90`) spanning a deep open chasm (`ty: 28..29` open pit below the bridge deck, framed by bridge piers and decorative arches/railings).
     - Leads directly into the **Pre-Boss Mini-Room** (`tx: 92..103`, `ty: 21..26`), an enclosed antechamber housing **Checkpoint 2** (`tx: 97, ty: 27`) before the boss gate at `BOSS_GATE_TX = 103`.
   - **Zone 5 — Multi-Tier Boss Arena ("Chefe") (`tx: 104..135`)**:
     - A grand tall enclosed hall (`ty: 5..26`, floor at `ty: 27`) featuring 4 rows of multi-column one-way combat platforms (`ty: 24, 21, 18, 15`) matching the tall multi-tier grid in the sketch.
     - Houses **1 enemy** (`checkpointGroup: 2`) near the lower entrance (`tx: 110, ty: 27`) and the **Boss** at `tx: 126, ty: 27` (`triggerTx: 105`).
