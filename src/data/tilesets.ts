import type { Era, EraTilesetConfig } from "../types";

/**
 * Level 01 tileset contract following `guia_de_uso_do_tileset_level_01.md`.
 * Every era PNG is an 8x4 sheet (32 frames of 32x32) sharing identical frame indices,
 * so switching era swaps only the texture.
 */
const LEVEL_01_FRAMES: Omit<EraTilesetConfig, "sprite"> = {
	// Row 0 (0..2): walkable solid ground & roof slabs
	topLeft: [0],
	top: [1],
	topRight: [2],
	// 1-tile solid roofs/beams use solid ground slabs (0..2), NEVER thin one-way planks (4..6)
	thinLeft: [0],
	thinMid: [1],
	thinRight: [2],
	thinSingle: [1],
	// Row 1 (8): cohesive solid wall/subsoil fill (avoid harsh multi-color checkerboard)
	left: [8],
	center: [8],
	right: [8],
	bottomLeft: [8],
	bottom: [8],
	bottomRight: [8],
	// Structural columns (3 = capital/top, 11 = shaft, 20 = base)
	pillarTop: [3],
	pillarMid: [11],
	pillarBottom: [20],
	// Row 2 (16): cohesive interior background wall across all three eras
	innerBg: [16],
	// Row 0 (4..6): pass-through one-way platforms only
	oneWayLeft: [4],
	oneWayMid: [5],
	oneWayRight: [6],
	// Guide architectural details: inner ceiling corners (12, 13) & pit cliffs (22, 23)
	innerCornerLeft: 12,
	innerCornerRight: 13,
	pitEdgeLeft: 22,
	pitEdgeRight: 23,
	props: {
		ceilingWires: 14,
		railingLeft: 24,
		railingMid: 25,
		railingRight: 26,
		barrier: 25,
		portal: 27,
		door: 28,
		window: 30,
		light: 31,
	},
};

const PAST_PROPS: EraTilesetConfig["props"] = {
	...LEVEL_01_FRAMES.props,
	railingLeft: undefined,
	railingMid: undefined,
	railingRight: undefined,
	window: { sprite: "past-prop-window", anchor: "center" },
	light: undefined,
	door: undefined,
	portal: undefined,
	banner: undefined,
	bannerAlt: { sprite: "past-prop-banner-alt", anchor: "top" },
	brazier: undefined,
	crateStack: undefined,
	bookshelf: undefined,
	stall: { sprite: "past-prop-stall", anchor: "bot" },
	cage: { sprite: "past-prop-cage", anchor: "top" },
	arch: undefined,
	tower: undefined,
	arenaGate: { sprite: "past-prop-gate", anchor: "bot" },
};

const PRESENT_PROPS: EraTilesetConfig["props"] = {
	...LEVEL_01_FRAMES.props,
	ceilingWires: undefined,
	railingLeft: undefined,
	railingMid: undefined,
	railingRight: undefined,
	window: { sprite: "present-prop-window", anchor: "center" },
	light: undefined,
	door: { sprite: "present-prop-door", anchor: "bot" },
	portal: undefined,
	banner: undefined,
	bannerAlt: { sprite: "present-prop-banner-alt", anchor: "top" },
	brazier: undefined,
	crateStack: undefined,
	bookshelf: { sprite: "present-prop-bookshelf", anchor: "bot" },
	stall: { sprite: "present-prop-stall", anchor: "bot" },
	cage: { sprite: "present-prop-cage", anchor: "top" },
	arch: undefined,
	tower: undefined,
	arenaGate: { sprite: "present-prop-gate", anchor: "bot" },
};

const FUTURE_PROPS: EraTilesetConfig["props"] = {
	...LEVEL_01_FRAMES.props,
	ceilingWires: undefined,
	railingLeft: undefined,
	railingMid: undefined,
	railingRight: undefined,
	window: { sprite: "future-prop-window", anchor: "center" },
	light: undefined,
	door: undefined,
	portal: undefined,
	banner: { sprite: "future-prop-banner", anchor: "top" },
	bannerAlt: undefined,
	brazier: undefined,
	crateStack: undefined,
	bookshelf: undefined,
	stall: { sprite: "future-prop-stall", anchor: "bot" },
	cage: { sprite: "future-prop-cage", anchor: "top" },
	arch: undefined,
	tower: undefined,
	arenaGate: { sprite: "future-prop-gate", anchor: "bot" },
};

export const ERA_TILESETS: Record<Era, EraTilesetConfig> = {
	past: {
		sprite: "past-tileset",
		...LEVEL_01_FRAMES,
		innerBg: [16, 17, 18, 19],
		props: PAST_PROPS,
	},
	present: {
		sprite: "present-tileset",
		...LEVEL_01_FRAMES,
		innerBg: [16, 17, 18, 19],
		props: PRESENT_PROPS,
	},
	future: {
		sprite: "future-tileset",
		...LEVEL_01_FRAMES,
		innerBg: [16, 17, 18, 19],
		props: FUTURE_PROPS,
	},
};
