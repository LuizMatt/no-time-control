export type Era = "past" | "present" | "future";

export type WeaponId = "w1" | "w2" | "w3";

export type BossPattern = "chargeMelee" | "projectileBarrage" | "teleportLaser";

export interface EraConfig {
	id: Era;
	label: string;
	subtitle: string;
	tint: [number, number, number];
	platformColor: [number, number, number];
	accentColor: [number, number, number];
	weapon: WeaponId;
	enemyPool: string[];
	bossId: string;
	bgSprite?: string;
	music?: string;
}

export interface WeaponDef {
	id: WeaponId;
	name: string;
	key: "1" | "2" | "3";
	era: Era;
	damage: number;
	cooldown: number;
	kind: "melee" | "projectile";
	piercing?: boolean;
	range: number;
	projectileSpeed?: number;
	color: [number, number, number];
}

export interface EnemyDef {
	id: string;
	name: string;
	era: Era;
	hp: number;
	speed: number;
	contactDamage: number;
	behavior: "patrol" | "chase" | "fly" | "shoot";
	width: number;
	height: number;
	color: [number, number, number];
	sprite?: string;
}

export interface BossDef {
	id: string;
	name: string;
	era: Era;
	hp: number;
	speed: number;
	contactDamage: number;
	pattern: BossPattern;
	attackCooldown: number;
	width: number;
	height: number;
	color: [number, number, number];
	sprite?: string;
}

export interface CheckpointDef {
	id: number;
	tx: number;
	ty: number;
}

export interface EnemySpawnDef {
	tx: number;
	ty: number;
	poolIndex: 0 | 1;
	checkpointGroup: number;
}

export interface StageDef {
	tileWidth: number;
	tileHeight: number;
	map: string[];
	checkpoints: CheckpointDef[];
	spawns: EnemySpawnDef[];
	props?: StagePropDef[];
	bossSpawn: {
		tx: number;
		ty: number;
		triggerTx: number;
	};
}

export type StagePropKind =
	| "terminal"
	| "barrier"
	| "crate"
	| "chest"
	| "trashCan"
	| "trashBag"
	| "puddle"
	| "floorWires"
	| "ceilingWires"
	| "window"
	| "light"
	| "door"
	| "portal"
	| "railingLeft"
	| "railingMid"
	| "railingRight"
	| "banner"
	| "bannerAlt"
	| "brazier"
	| "crateStack"
	| "cage"
	| "arch"
	| "stall"
	| "bookshelf"
	| "tower"
	| "arenaGate";

export interface PropSpriteSpec {
	sprite: string;
	anchor: "bot" | "top" | "center";
	offsetX?: number;
	offsetY?: number;
	z?: number;
}

export type EraPropEntry = number | PropSpriteSpec;

export interface StagePropDef {
	tx: number;
	ty: number;
	kind: StagePropKind;
	flipX?: boolean;
}

export interface EraTilesetConfig {
	sprite: string;
	topLeft: readonly number[];
	top: readonly number[];
	topRight: readonly number[];
	left: readonly number[];
	center: readonly number[];
	right: readonly number[];
	bottomLeft: readonly number[];
	bottom: readonly number[];
	bottomRight: readonly number[];
	thinLeft: readonly number[];
	thinMid: readonly number[];
	thinRight: readonly number[];
	thinSingle: readonly number[];
	pillarTop: readonly number[];
	pillarMid: readonly number[];
	pillarBottom: readonly number[];
	innerBg: readonly number[];
	oneWayLeft: readonly number[];
	oneWayMid: readonly number[];
	oneWayRight: readonly number[];
	innerCornerLeft?: number;
	innerCornerRight?: number;
	pitEdgeLeft?: number;
	pitEdgeRight?: number;
	props: Partial<Record<StagePropKind, EraPropEntry>>;
}

export interface DialogueLine {
	speaker: string;
	text: string;
}

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
