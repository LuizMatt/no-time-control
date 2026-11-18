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
		sliceY: 3,
	});

	k.loadSprite("present-tileset", "sprites/present-tileset.png", {
		sliceX: 8,
		sliceY: 3,
	});

	k.loadSprite("future-tileset", "sprites/future-tileset.png", {
		sliceX: 8,
		sliceY: 3,
	});
}
