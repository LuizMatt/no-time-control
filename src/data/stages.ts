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
		"#.......................................................................############...................#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB#", // 10
		"#.......................................................................#BBBBBBBBBB#...................#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB#", // 11
		"#..............################.........................................#BBBBBBBBBB#.-----.............#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB#", // 12
		"#..............#BBBBBBBBBBBBBB#.........................................#BBBBBBBBBB#...................#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB#", // 13
		"#..............#BBBBBBBBBBBBBB#...........------...........-----........#BBBB----BB#...................#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB#", // 14
		"#..........----#BBBBBBBBBBBBBB#.........................................#BBBBBBBBBB#.......-------.....#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB#", // 15
		"#..............#BBBBBBBBBBBBBB#.........................................#BBBBBBBBBB#...................#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB#", // 16
		"#......-----...#BBBB------BBBB#.................-----...-----...........#BBBBB----B#...................#BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB#", // 17
		"#..............BBBBBBBBBBBBBBBB..................................-----..BBBBBBBBBBBB........-----.......BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB#", // 18
		"#..............BBBBBBBBBBBBBBBB.........................................BBBBBBBBBBBB....................BBBBBBBB------BBBBBB------BBBBB#", // 19
		"#......-----...BBBB-----BBBBBBB...............-----...........-----.....BB----BBBBBB....................BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB#", // 20
		"#..............BBBBBBBBBBBBBBBB.........................................BBBBBBBBBBBB.......-----........BB----BBBBBBBBB-----BBBBBBBBBBB#", // 21
		"#..............BBBBBBBBBBBBBBBB.......^^............^....^^.............BBBBBBBBBBBB....^^..............BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB#", // 22
		"##############################....###########...################...###########...####################..#################################", // 23
		"##############################....###########...################...###########...####################..#################################", // 24
		"##############################....###########...################...###########...####################..#################################", // 25
	],
	checkpoints: [
		{ id: 0, tx: 3, ty: 23 },
		{ id: 1, tx: 35, ty: 23 },
		{ id: 2, tx: 68, ty: 23 },
		{ id: 3, tx: 100, ty: 23 },
	],
	spawns: [
		{ tx: 20, ty: 23, poolIndex: 0, checkpointGroup: 0 },
		{ tx: 25, ty: 12, poolIndex: 1, checkpointGroup: 0 },
		{ tx: 42, ty: 23, poolIndex: 0, checkpointGroup: 1 },
		{ tx: 52, ty: 17, poolIndex: 1, checkpointGroup: 1 },
		{ tx: 60, ty: 23, poolIndex: 0, checkpointGroup: 1 },
		{ tx: 76, ty: 23, poolIndex: 1, checkpointGroup: 2 },
		{ tx: 78, ty: 10, poolIndex: 0, checkpointGroup: 2 },
		{ tx: 93, ty: 23, poolIndex: 1, checkpointGroup: 2 },
	],
	props: [
		// Opening building rooftop railings, interior windows, banners, torches, doors & medieval furniture
		{ tx: 16, ty: 11, kind: "railingLeft" },
		{ tx: 17, ty: 11, kind: "railingMid" },
		{ tx: 18, ty: 11, kind: "railingMid" },
		{ tx: 19, ty: 11, kind: "railingRight" },
		{ tx: 27, ty: 11, kind: "railingLeft" },
		{ tx: 28, ty: 11, kind: "railingMid" },
		{ tx: 29, ty: 11, kind: "railingRight" },
		{ tx: 17, ty: 13, kind: "banner" },
		{ tx: 19, ty: 13, kind: "ceilingWires" },
		{ tx: 22, ty: 13, kind: "bannerAlt" },
		{ tx: 26, ty: 13, kind: "ceilingWires" },
		{ tx: 28, ty: 13, kind: "banner" },
		{ tx: 18, ty: 15, kind: "window" },
		{ tx: 23, ty: 15, kind: "window" },
		{ tx: 27, ty: 15, kind: "window" },
		{ tx: 20, ty: 15, kind: "light" },
		{ tx: 25, ty: 15, kind: "light" },
		{ tx: 17, ty: 21, kind: "light" },
		{ tx: 18, ty: 22, kind: "bookshelf" },
		{ tx: 22, ty: 22, kind: "portal" },
		{ tx: 25, ty: 22, kind: "crateStack" },
		{ tx: 27, ty: 22, kind: "door" },
		// Central plaza, towers & pit crossings
		{ tx: 37, ty: 22, kind: "brazier" },
		{ tx: 44, ty: 22, kind: "tower" },
		{ tx: 47, ty: 22, kind: "crateStack" },
		{ tx: 50, ty: 22, kind: "portal" },
		{ tx: 54, ty: 22, kind: "stall" },
		{ tx: 59, ty: 22, kind: "brazier" },
		{ tx: 64, ty: 22, kind: "tower" },
		// Two-story mid-stage facility
		{ tx: 73, ty: 9, kind: "railingLeft" },
		{ tx: 74, ty: 9, kind: "railingMid" },
		{ tx: 75, ty: 9, kind: "railingRight" },
		{ tx: 74, ty: 11, kind: "banner" },
		{ tx: 76, ty: 11, kind: "ceilingWires" },
		{ tx: 81, ty: 11, kind: "cage" },
		{ tx: 75, ty: 13, kind: "window" },
		{ tx: 80, ty: 13, kind: "window" },
		{ tx: 77, ty: 15, kind: "light" },
		{ tx: 75, ty: 22, kind: "portal" },
		{ tx: 81, ty: 22, kind: "crateStack" },
		{ tx: 91, ty: 22, kind: "brazier" },
		{ tx: 96, ty: 22, kind: "door" },
		// Boss arena architectural backdrop
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
		{ tx: 112, ty: 15, kind: "light" },
		{ tx: 120, ty: 15, kind: "light" },
		{ tx: 127, ty: 15, kind: "light" },
		{ tx: 106, ty: 22, kind: "brazier" },
		{ tx: 112, ty: 22, kind: "arch" },
		{ tx: 120, ty: 22, kind: "portal" },
		{ tx: 126, ty: 22, kind: "arch" },
		{ tx: 133, ty: 22, kind: "door" },
		{ tx: 131, ty: 22, kind: "brazier" },
	],
	bossSpawn: {
		tx: 126,
		ty: 23,
		triggerTx: 105,
	},
};
