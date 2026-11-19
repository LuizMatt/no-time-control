import type { StageDef } from "../types";

export const STAGE_1: StageDef = {
	tileWidth: 32,
	tileHeight: 32,
	map: [
		// 0         1         2         3         4         5         6         7         8         9         10        11        12        13        14
		// 0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567
		"#.........................................................................................................##########################################", // 0
		"#.........................................................................................................#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB#", // 1
		"#.........................................................................................................#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB#", // 2
		"#.........................................................................................................#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB#", // 3
		"#.........................................................................................................#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB#", // 4
		"#..........................................................................................################BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB#", // 5
		"#..........................................................................................#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB#", // 6
		"#..........................................................................................#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB#", // 7
		"#..........................................................................................#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB#", // 8
		"#..........................................................................................#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB#", // 9
		"#..........................................................................................#BBBBBBBBBBBBBB##########################################", // 10
		"#..........................................................................................#BBBBBBBBBBBBBB##########################################", // 11
		"#..........................................................................................#BBBBBB-----BBB##########################################", // 12
		"#..........########-------.................................................................#BBBBBBBBBBBBBB##########################################", // 13
		"#..........#BBBBBBBBBBBBB#......######BBBB#####............................................#BBBBBBBBBBBBBB##########################################", // 14
		"#..........#BBBBBB-----BB#......#BBBBBBBBBBBBB#............................................#BB------BBBBBB##########################################", // 15
		"#..........#BBBBBBBBBBBBB#......#BBBBBBBBBBBBB#............................................#BBBBBBBBBBBBBB##########################################", // 16
		"#..........#BBBBBBBBBBBBB#......#BBBB-----BBBB#............................................#BBBBBBBBBBBBBB##########################################", // 17
		"#..........#BB------BBBBB#......#BBBBBBBBBBBBB#............................................#BBBBBBB-----BB##########################################", // 18
		"#..........#BBBBBBBBBBBBB#......#BBBBBBBBBBBBB#............................................#BBBBBBBBBBBBBB##########################################", // 19
		"#..........#BBBBBBBBBBBBB#......#BBBBBBBB-----#............................................#BBBBBBBBBBBBBB##########################################", // 20
		"#..........#BBBBBB------B#......#BBBBBBBBBBBBB#............................................#BB------BBBBBB##########################################", // 21
		"#..........#BBBBBBBBBBBBB#......#BBBBBBBBBBBBB#............................................#BBBBBBBBBBBBBB##########################################", // 22
		"#..........#BBBBBBBBBBBBB#......#BB------BBBBB#...........------...........................#BBBBBBBBBBBBBB##########################################", // 23
		"#..........#BB-----BBBBBB#......#BBBBBBBBBBBBB#............................................#BBBBBBB-----BB##########################################", // 24
		"#..........BBBBBBBBBBBBBB#......#BBBBBBBBBBBBBB....-----..........-----....................BBBBBBBBBBBBBBB##########################################", // 25
		"#..........BBBBBBBBBBBBBB#......#BBBBBBBBBBBBBB...^^....^^......^^....^^...................BBBBBBBBBBBBBBB##########################################", // 26
		"##########################....############################################...#######################################################################", // 27
		"##########################....############################################...#...........###########################################################", // 28
		"##########################....############################################...#...........###########################################################", // 29
	],
	checkpoints: [
		// CP0: Initial spawn at bottom-left before Building 1 ("Montanha / Prédio / Vielas")
		{ id: 0, tx: 3, ty: 27 },
		// CP1 ("X" in sketch): Top-left entrance ledge of the Castle after the high jump ("Pulo")
		{ id: 1, tx: 34, ty: 14 },
		// CP2: Safe Pre-Boss Mini-Room at the top of the Tower, right before the Boss gate
		{ id: 2, tx: 111, ty: 10 },
	],
	spawns: [
		// Zone 1 ("Montanha / Prédio / Vielas"): 2 enemies inside the vertical climb
		{ tx: 15, ty: 24, poolIndex: 0, checkpointGroup: 0 },
		{ tx: 15, ty: 18, poolIndex: 1, checkpointGroup: 0 },
		// Zone 2 ("Castelo"): 1 enemy inside the Castle descent
		{ tx: 39, ty: 17, poolIndex: 0, checkpointGroup: 1 },
		// Zone 3 (3 Suspended Platforms): 1 enemy on the middle platform
		{ tx: 60, ty: 23, poolIndex: 1, checkpointGroup: 1 },
		// Zone 4 (Base of the Final Tower): 1 enemy guarding the entrance
		{ tx: 98, ty: 27, poolIndex: 0, checkpointGroup: 1 },
	],
	props: [
		// Zone 1: "Montanha / Prédio / Vielas futuristas" vertical climb
		{ tx: 13, ty: 12, kind: "railingLeft" },
		{ tx: 14, ty: 12, kind: "railingMid" },
		{ tx: 15, ty: 12, kind: "railingRight" },
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
		{ tx: 34, ty: 13, kind: "railingLeft" },
		{ tx: 35, ty: 13, kind: "railingMid" },
		{ tx: 36, ty: 13, kind: "railingRight" },
		{ tx: 35, ty: 15, kind: "banner" },
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

		// Zone 4: "Ponte" + Tower Climb + Pre-Boss Mini-Room at top (CP2)
		{ tx: 77, ty: 26, kind: "brazier" },
		{ tx: 80, ty: 26, kind: "arch" },
		{ tx: 86, ty: 26, kind: "arch" },
		{ tx: 89, ty: 26, kind: "brazier" },
		{ tx: 94, ty: 26, kind: "crateStack" },
		{ tx: 98, ty: 26, kind: "portal" },
		{ tx: 102, ty: 26, kind: "brazier" },
		{ tx: 95, ty: 22, kind: "window" },
		{ tx: 101, ty: 19, kind: "light" },
		{ tx: 95, ty: 16, kind: "window" },
		{ tx: 101, ty: 13, kind: "light" },
		{ tx: 94, ty: 8, kind: "banner" },
		{ tx: 98, ty: 8, kind: "window" },
		{ tx: 102, ty: 8, kind: "bannerAlt" },
		// Pre-Boss Mini-Room (top of tower, tx: 107..116)
		{ tx: 109, ty: 1, kind: "banner" },
		{ tx: 112, ty: 1, kind: "ceilingWires" },
		{ tx: 115, ty: 1, kind: "bannerAlt" },
		{ tx: 111, ty: 5, kind: "window" },
		{ tx: 115, ty: 5, kind: "light" },
		{ tx: 109, ty: 9, kind: "brazier" },
		{ tx: 115, ty: 9, kind: "brazier" },

		// Zone 5: Boss Arena at the Top of the Tower (tx: 118..146, floor ty: 10)
		{ tx: 121, ty: 1, kind: "banner" },
		{ tx: 125, ty: 1, kind: "ceilingWires" },
		{ tx: 129, ty: 1, kind: "cage" },
		{ tx: 134, ty: 1, kind: "bannerAlt" },
		{ tx: 139, ty: 1, kind: "ceilingWires" },
		{ tx: 143, ty: 1, kind: "banner" },
		{ tx: 122, ty: 5, kind: "window" },
		{ tx: 129, ty: 5, kind: "window" },
		{ tx: 136, ty: 5, kind: "window" },
		{ tx: 143, ty: 5, kind: "window" },
		{ tx: 120, ty: 9, kind: "brazier" },
		{ tx: 126, ty: 9, kind: "arch" },
		{ tx: 132, ty: 9, kind: "portal" },
		{ tx: 138, ty: 9, kind: "arch" },
		{ tx: 144, ty: 9, kind: "door" },
		{ tx: 142, ty: 9, kind: "brazier" },
	],
	bossSpawn: {
		tx: 139,
		ty: 10,
		triggerTx: 119,
	},
};
