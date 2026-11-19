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
	light: { sprite: "past-prop-torch", anchor: "center" },
	door: { sprite: "past-prop-door", anchor: "bot" },
	portal: { sprite: "past-prop-portal", anchor: "bot" },
	banner: { sprite: "past-prop-banner", anchor: "top" },
	bannerAlt: { sprite: "past-prop-banner-alt", anchor: "top" },
	brazier: { sprite: "past-prop-brazier", anchor: "bot" },
	crateStack: { sprite: "past-prop-crates", anchor: "bot" },
	bookshelf: { sprite: "past-prop-bookshelf", anchor: "bot" },
	stall: { sprite: "past-prop-stall", anchor: "bot" },
	cage: { sprite: "past-prop-cage", anchor: "top" },
	arch: { sprite: "past-prop-arch", anchor: "bot" },
	tower: { sprite: "past-prop-tower", anchor: "bot", z: -3 },
	arenaGate: { sprite: "past-prop-gate", anchor: "bot" },
};

export const ERA_TILESETS: Record<Era, EraTilesetConfig> = {
	past: {
		sprite: "past-tileset",
		...LEVEL_01_FRAMES,
		innerBg: [16, 17, 18, 19],
		props: PAST_PROPS,
	},
	present: { sprite: "present-tileset", ...LEVEL_01_FRAMES },
	future: { sprite: "future-tileset", ...LEVEL_01_FRAMES },
};
