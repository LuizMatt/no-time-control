import { k } from "./k";

/** Registers all game sprites and sounds before scenes start. */
export function loadAssets(): void {
	k.loadRoot("./");

	k.loadSprite("player", "sprites/player.png", {
		sliceX: 10,
		sliceY: 8,
		anims: {
			idle: { from: 0, to: 4, speed: 6, loop: true },
			run: { from: 10, to: 17, speed: 12, loop: true },
			jump: { from: 22, to: 24, speed: 14, loop: false },
			fall: { from: 25, to: 26, speed: 8, loop: true },
			attack: { from: 30, to: 36, speed: 18, loop: false },
			death: { from: 40, to: 45, speed: 9, loop: false },
			dash: { from: 50, to: 54, speed: 28, loop: false },
			attack_pistol: { from: 60, to: 65, speed: 20, loop: false },
			attack_plasma: { from: 70, to: 75, speed: 15, loop: false },
		},
	});

	k.loadSprite("werewolf", "sprites/werewolf.png", {
		sliceX: 27,
		sliceY: 1,
		anims: {
			idle: { from: 0, to: 3, speed: 6, loop: true },
			run: { from: 4, to: 9, speed: 12, loop: true },
			jump: { from: 10, to: 11, speed: 10, loop: false },
			fall: { from: 12, to: 13, speed: 8, loop: true },
			attack: { from: 14, to: 17, speed: 14, loop: false },
			dash: { from: 18, to: 20, speed: 18, loop: false },
			howl: { from: 21, to: 23, speed: 8, loop: false },
			death: { from: 24, to: 26, speed: 8, loop: false },
		},
	});

	k.loadSprite("bullet", "sprites/bullet.png", {
		sliceX: 5,
		sliceY: 1,
		anims: {
			fly: { from: 0, to: 1, speed: 14, loop: true },
			hit: { from: 2, to: 4, speed: 18, loop: false },
		},
	});

	k.loadSprite("enemy-present-bullet", "sprites/enemy-present-bullet.png", {
		sliceX: 5,
		sliceY: 1,
		anims: {
			fly: { from: 0, to: 1, speed: 14, loop: true },
			hit: { from: 2, to: 4, speed: 18, loop: false },
		},
	});

	k.loadSprite("enemy-future-plasma", "sprites/enemy-future-plasma.png", {
		sliceX: 5,
		sliceY: 1,
		anims: {
			fly: { from: 0, to: 1, speed: 14, loop: true },
			hit: { from: 2, to: 4, speed: 18, loop: false },
		},
	});

	k.loadSprite("plasma", "sprites/plasma.png", {
		sliceX: 6,
		sliceY: 1,
		anims: {
			fly: { from: 0, to: 2, speed: 14, loop: true },
			hit: { from: 3, to: 5, speed: 18, loop: false },
		},
	});

	k.loadSprite("hearts", "sprites/hearts.png", {
		sliceX: 6,
		sliceY: 2,
		anims: {
			full: { from: 0, to: 0 },
			flash: { from: 6, to: 9, speed: 12, loop: false },
			break: { from: 6, to: 11, speed: 14, loop: false },
			empty: { from: 11, to: 11 },
		},
	});

	k.loadSprite("enemy-past-grunt", "sprites/enemy-past-grunt.png", {
		sliceX: 16,
		sliceY: 1,
		anims: {
			idle: { from: 0, to: 1, speed: 4, loop: true },
			walk: { from: 2, to: 5, speed: 8, loop: true },
			attack: { from: 6, to: 9, speed: 10, loop: false },
			hurt: { from: 10, to: 11, speed: 14, loop: false },
			death: { from: 12, to: 15, speed: 10, loop: false },
		},
	});

	k.loadSprite("enemy-past-brute", "sprites/enemy-past-brute.png", {
		sliceX: 16,
		sliceY: 1,
		anims: {
			idle: { from: 0, to: 1, speed: 4, loop: true },
			walk: { from: 2, to: 5, speed: 7, loop: true },
			attack: { from: 6, to: 9, speed: 9, loop: false },
			hurt: { from: 10, to: 11, speed: 14, loop: false },
			death: { from: 12, to: 15, speed: 10, loop: false },
		},
	});

	k.loadSprite("enemy-present-shooter", "sprites/enemy-present-shooter.png", {
		sliceX: 16,
		sliceY: 1,
		anims: {
			idle: { from: 0, to: 1, speed: 4, loop: true },
			walk: { from: 2, to: 5, speed: 8, loop: true },
			attack: { from: 6, to: 9, speed: 10, loop: false },
			hurt: { from: 10, to: 11, speed: 14, loop: false },
			death: { from: 12, to: 15, speed: 10, loop: false },
		},
	});

	k.loadSprite("enemy-present-drone", "sprites/enemy-present-drone.png", {
		sliceX: 12,
		sliceY: 1,
		anims: {
			idle: { from: 0, to: 1, speed: 8, loop: true },
			walk: { from: 2, to: 5, speed: 12, loop: true },
			hurt: { from: 6, to: 7, speed: 14, loop: false },
			death: { from: 8, to: 11, speed: 10, loop: false },
		},
	});

	k.loadSprite("enemy-future-stalker", "sprites/enemy-future-stalker.png", {
		sliceX: 16,
		sliceY: 1,
		anims: {
			idle: { from: 0, to: 1, speed: 4, loop: true },
			walk: { from: 2, to: 5, speed: 10, loop: true },
			attack: { from: 6, to: 9, speed: 12, loop: false },
			hurt: { from: 10, to: 11, speed: 14, loop: false },
			death: { from: 12, to: 15, speed: 10, loop: false },
		},
	});

	k.loadSprite("enemy-future-turret", "sprites/enemy-future-turret.png", {
		sliceX: 16,
		sliceY: 1,
		anims: {
			idle: { from: 0, to: 1, speed: 4, loop: true },
			walk: { from: 2, to: 5, speed: 7, loop: true },
			attack: { from: 6, to: 9, speed: 10, loop: false },
			hurt: { from: 10, to: 11, speed: 14, loop: false },
			death: { from: 12, to: 15, speed: 10, loop: false },
		},
	});

	k.loadSprite("boss-past", "sprites/boss-past.png", {
		sliceX: 11,
		sliceY: 1,
		anims: {
			idle: { from: 0, to: 2, speed: 5, loop: true },
			walk: { from: 0, to: 2, speed: 8, loop: true },
			telegraph: { from: 2, to: 3, speed: 10, loop: false },
			attack: { from: 4, to: 6, speed: 12, loop: true },
			melee: { from: 0, to: 3, speed: 12, loop: false },
			death: { from: 7, to: 10, speed: 6, loop: false },
		},
	});

	k.loadSprite("boss-present", "sprites/boss-present.png", {
		sliceX: 13,
		sliceY: 1,
		anims: {
			idle: { from: 0, to: 1, speed: 4, loop: true },
			walk: { from: 0, to: 3, speed: 8, loop: true },
			telegraph: { from: 4, to: 4, speed: 8, loop: false },
			attack: { from: 4, to: 6, speed: 12, loop: false },
			death: { from: 7, to: 12, speed: 7, loop: false },
		},
	});

	k.loadSprite("boss-future", "sprites/boss-future.png", {
		sliceX: 20,
		sliceY: 1,
		anims: {
			idle: { from: 0, to: 3, speed: 6, loop: true },
			walk: { from: 0, to: 3, speed: 8, loop: true },
			melee: { from: 4, to: 5, speed: 10, loop: false },
			telegraph: { from: 6, to: 6, speed: 8, loop: false },
			attack: { from: 6, to: 7, speed: 10, loop: false },
			teleportOut: { from: 8, to: 10, speed: 14, loop: false },
			teleportIn: { from: 11, to: 13, speed: 14, loop: false },
			death: { from: 14, to: 19, speed: 7, loop: false },
		},
	});

	k.loadSprite("past-tileset", "sprites/past-tileset.png", {
		sliceX: 8,
		sliceY: 4,
	});

	k.loadSprite("present-tileset", "sprites/present-tileset.png", {
		sliceX: 8,
		sliceY: 4,
	});

	k.loadSprite("future-tileset", "sprites/future-tileset.png", {
		sliceX: 8,
		sliceY: 4,
	});

	const pastProps: ReadonlyArray<readonly [string, string]> = [
		["past-prop-window", "sprites/props/past/window.png"],
		["past-prop-door", "sprites/props/past/door.png"],
		["past-prop-portal", "sprites/props/past/portal.png"],
		["past-prop-torch", "sprites/props/past/torch.png"],
		["past-prop-banner", "sprites/props/past/banner.png"],
		["past-prop-banner-alt", "sprites/props/past/banner-alt.png"],
		["past-prop-brazier", "sprites/props/past/brazier.png"],
		["past-prop-crates", "sprites/props/past/crates.png"],
		["past-prop-bookshelf", "sprites/props/past/bookshelf.png"],
		["past-prop-stall", "sprites/props/past/stall.png"],
		["past-prop-cage", "sprites/props/past/cage.png"],
		["past-prop-arch", "sprites/props/past/arch.png"],
		["past-prop-tower", "sprites/props/past/tower.png"],
		["past-prop-gate", "sprites/props/past/gate.png"],
	];

	for (const [name, path] of pastProps) {
		k.loadSprite(name, path);
	}

	const presentProps: ReadonlyArray<readonly [string, string]> = [
		["present-prop-window", "sprites/props/present/window.png"],
		["present-prop-door", "sprites/props/present/door.png"],
		["present-prop-portal", "sprites/props/present/portal.png"],
		["present-prop-light", "sprites/props/present/light.png"],
		["present-prop-banner", "sprites/props/present/banner.png"],
		["present-prop-banner-alt", "sprites/props/present/banner-alt.png"],
		["present-prop-brazier", "sprites/props/present/brazier.png"],
		["present-prop-crates", "sprites/props/present/crates.png"],
		["present-prop-bookshelf", "sprites/props/present/bookshelf.png"],
		["present-prop-stall", "sprites/props/present/stall.png"],
		["present-prop-cage", "sprites/props/present/cage.png"],
		["present-prop-arch", "sprites/props/present/arch.png"],
		["present-prop-tower", "sprites/props/present/tower.png"],
		["present-prop-gate", "sprites/props/present/gate.png"],
	];

	for (const [name, path] of presentProps) {
		k.loadSprite(name, path);
	}

	const futureProps: ReadonlyArray<readonly [string, string]> = [
		["future-prop-window", "sprites/props/future/window.png"],
		["future-prop-door", "sprites/props/future/door.png"],
		["future-prop-portal", "sprites/props/future/portal.png"],
		["future-prop-light", "sprites/props/future/light.png"],
		["future-prop-banner", "sprites/props/future/banner.png"],
		["future-prop-banner-alt", "sprites/props/future/banner-alt.png"],
		["future-prop-brazier", "sprites/props/future/brazier.png"],
		["future-prop-crates", "sprites/props/future/crates.png"],
		["future-prop-bookshelf", "sprites/props/future/bookshelf.png"],
		["future-prop-stall", "sprites/props/future/stall.png"],
		["future-prop-cage", "sprites/props/future/cage.png"],
		["future-prop-arch", "sprites/props/future/arch.png"],
		["future-prop-tower", "sprites/props/future/tower.png"],
		["future-prop-gate", "sprites/props/future/gate.png"],
	];

	for (const [name, path] of futureProps) {
		k.loadSprite(name, path);
	}

	const pastParallax: ReadonlyArray<readonly [string, string]> = [
		["past-bg-sky", "sprites/parallax/past/sky-moon.png"],
		["past-bg-clouds", "sprites/parallax/past/clouds.png"],
		["past-bg-far-mountains", "sprites/parallax/past/far-mountains.png"],
		["past-bg-mid-mountains", "sprites/parallax/past/mid-mountains.png"],
		["past-bg-forest", "sprites/parallax/past/pine-forest.png"],
		["past-bg-near-pines", "sprites/parallax/past/near-pines.png"],
	];

	for (const [name, path] of pastParallax) {
		k.loadSprite(name, path);
	}

	const presentParallax: ReadonlyArray<readonly [string, string]> = [
		["present-bg-sky", "sprites/parallax/present/sky-clouds.png"],
		["present-bg-far", "sprites/parallax/present/far-skyline.png"],
		["present-bg-near", "sprites/parallax/present/near-city.png"],
	];

	for (const [name, path] of presentParallax) {
		k.loadSprite(name, path);
	}

	const futureParallax: ReadonlyArray<readonly [string, string]> = [
		["future-bg-sky", "sprites/parallax/future/sky-smog.png"],
		["future-bg-far-towers", "sprites/parallax/future/far-towers.png"],
		["future-bg-mid-scaffolding", "sprites/parallax/future/mid-scaffolding.png"],
		["future-bg-near-industrial", "sprites/parallax/future/near-industrial.png"],
	];

	for (const [name, path] of futureParallax) {
		k.loadSprite(name, path);
	}

	k.loadSprite("intro-cutscene", "sprites/intro-cutscene.png");

	const sfxList: ReadonlyArray<readonly [string, string]> = [
		["sfx-shot", "sounds/01_tiro.wav"],
		["sfx-axe", "sounds/02_machado.wav"],
		["sfx-plasma", "sounds/03_tiro_de_plasma.wav"],
		["sfx-boss-future-plasma", "sounds/04_tiro_de_plasma_boss_futuro.wav"],
		["sfx-teleport", "sounds/05_teleport.wav"],
		["sfx-hit", "sounds/06_hit.wav"],
		["sfx-dash", "sounds/07_avanco.wav"],
		["sfx-burst", "sounds/08_rajada_de_tiros.wav"],
		["sfx-turret-plasma", "sounds/09_tiro_de_plasma_torreta.wav"],
		["sfx-past-mob-hit", "sounds/10_hit_mobs_passado.wav"],
		["sfx-checkpoint", "sounds/11_checkpoint.wav"],
		["sfx-transform", "sounds/12_transformar_lobo.wav"],
		["sfx-werewolf-attack", "sounds/13_hit_lobo.wav"],
		["sfx-type", "sounds/14_type.wav"],
		["sfx-type-loop", "sounds/14_type_loop_2_6s.wav"],
	];

	for (const [name, path] of sfxList) {
		k.loadSound(name, path);
	}

	k.loadMusic("bgm-main", "sounds/soundtrack.mp4");
}
