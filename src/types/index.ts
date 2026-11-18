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
	bossSpawn: {
		tx: number;
		ty: number;
		triggerTx: number;
	};
}

export interface DialogueLine {
	speaker: string;
	text: string;
}
