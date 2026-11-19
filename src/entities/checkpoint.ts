import { playSfx } from "../core/audio";
import { k } from "../core/k";
import { state } from "../core/state";
import { ERAS } from "../data/eras";
import type { CheckpointDef } from "../types";

export function makeCheckpoint(def: CheckpointDef, tileWidth: number, tileHeight: number) {
	const isActivated = state.checkpointId >= def.id;
	const initialColor: [number, number, number] = isActivated
		? ERAS[state.currentEra].accentColor
		: [110, 115, 130];

	const checkpoint = k.add([
		k.rect(14, 48),
		k.pos(def.tx * tileWidth + tileWidth / 2, def.ty * tileHeight),
		k.anchor("bot"),
		k.area(),
		k.color(...initialColor),
		k.z(5),
		"checkpoint",
	]);

	checkpoint.onCollide("player", () => {
		if (state.checkpointId >= def.id) {
			return;
		}

		state.checkpointId = def.id;
		state.hp = state.maxHp;
		playSfx("sfx-checkpoint", { volume: 0.9 });

		const accent = ERAS[state.currentEra].accentColor;
		checkpoint.color = k.rgb(...accent);

		const label = k.add([
			k.text("CHECKPOINT SALVO", { size: 14 }),
			k.pos(checkpoint.pos.x, checkpoint.pos.y - 58),
			k.anchor("center"),
			k.color(...accent),
			k.opacity(1),
			k.z(30),
		]);

		let elapsed = 0;
		label.onUpdate(() => {
			const dt = k.dt();
			elapsed += dt;
			label.pos.y -= 30 * dt;
			label.opacity = Math.max(0, 1 - elapsed);
			if (elapsed >= 1) {
				label.destroy();
			}
		});
	});

	return checkpoint;
}
