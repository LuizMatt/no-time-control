import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../core/constants";
import { k } from "../core/k";
import { ERA_PARALLAX } from "../data/parallax";
import type { Era } from "../types";

/** Creates fixed, camera-driven seamless parallax background layers for the given era. */
export function createEraParallax(era: Era, mapHeight: number = SCREEN_HEIGHT): void {
	const layers = ERA_PARALLAX[era];
	if (!layers || layers.length === 0) return;

	const minCamY = SCREEN_HEIGHT / 2;
	const maxCamY = Math.max(minCamY, mapHeight - SCREEN_HEIGHT / 2);

	for (const layer of layers) {
		const tileW = layer.width * layer.scale;
		const tileH = layer.height * layer.scale;
		const fillColor = layer.fillBelowColor ? k.rgb(...layer.fillBelowColor) : undefined;
		let drift = 0;

		k.add([
			k.fixed(),
			k.z(layer.z),
			"era-parallax",
			{
				draw() {
					if (layer.driftX) {
						drift += layer.driftX * k.dt();
					}

					const cam = k.camPos();
					const rawX = cam.x * layer.speedX - drift;
					const wrappedX = ((rawX % tileW) + tileW) % tileW;
					const startX = -Math.round(wrappedX);

					let drawY: number;
					if (layer.align === "top") {
						const dy = Math.max(0, cam.y - minCamY) * layer.speedY;
						drawY = Math.min(0, Math.round(layer.offsetY - dy));
					} else {
						// Anchor flush at bottom when camera is at map bottom; sink gently as player climbs higher
						const dy = Math.max(0, maxCamY - cam.y) * layer.speedY;
						drawY = Math.max(
							SCREEN_HEIGHT - tileH,
							Math.round(SCREEN_HEIGHT - tileH + layer.offsetY + dy),
						);
					}

					if (fillColor && drawY + tileH < SCREEN_HEIGHT) {
						k.drawRect({
							pos: k.vec2(0, drawY + tileH),
							width: SCREEN_WIDTH,
							height: SCREEN_HEIGHT - (drawY + tileH),
							color: fillColor,
						});
					}

					for (let x = startX; x < SCREEN_WIDTH; x += tileW) {
						k.drawSprite({
							sprite: layer.sprite,
							pos: k.vec2(x, drawY),
							scale: layer.scale,
						});
					}
				},
			},
		]);
	}
}
