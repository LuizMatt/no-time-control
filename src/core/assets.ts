import { k } from "./k";

/** Registers all game sprites and sounds before scenes start. */
export function loadAssets(): void {
	k.loadRoot("./");

	k.loadSprite("player", "sprites/player.png", {
		sliceX: 6,
		sliceY: 4,
		anims: {
			idle: { from: 0, to: 3, speed: 6, loop: true },
			run: { from: 6, to: 11, speed: 12, loop: true },
			dash: { from: 12, to: 15, speed: 18, loop: false },
			death: { from: 18, to: 23, speed: 10, loop: false },
		},
	});

	k.loadSprite("player-hit", "sprites/player-hit.png");

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
}
