// Screen resolution
export const SCREEN_WIDTH = 960;
export const SCREEN_HEIGHT = 540;

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

// Special meter and werewolf transformation
export const SPECIAL_MAX = 100;
export const SPECIAL_GAIN_HIT = 12;
export const SPECIAL_GAIN_KILL = 25;
export const TRANSFORM_DURATION = 7;
export const WEREWOLF_SPEED_MULT = 1.35;
export const WEREWOLF_JUMP_MULT = 1.18;
export const WEREWOLF_DAMAGE = 35;
export const WEREWOLF_COOLDOWN = 0.25;
export const WEREWOLF_RANGE = 64;

// Audio levels (max gain ceiling + default normalized slider 0..1)
export const SFX_MASTER_VOLUME = 0.85;
export const MUSIC_MASTER_VOLUME = 0.3;
export const DEFAULT_SFX_LEVEL = 0.7;
export const DEFAULT_MUSIC_LEVEL = 0.45;

// Input key bindings
export const KEYS = {
	LEFT: "a",
	RIGHT: "d",
	JUMP: "space",
	ATTACK: "h",
	DASH: "j",
	TRANSFORM: "q",
	WEAPON_1: "1",
	WEAPON_2: "2",
	WEAPON_3: "3",
	PAUSE: "escape",
} as const;
