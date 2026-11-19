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

	k.loadSprite("bullet", "sprites/bullet.png", {
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
}
