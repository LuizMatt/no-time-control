import { playSfx } from "../core/audio";
import { k } from "../core/k";
import { state } from "../core/state";
import { ERAS } from "../data/eras";
import type { CheckpointDef, Era } from "../types";

const CHECKPOINT_SPRITES: Record<Era, string> = {
	past: "checkpoint-past",
	present: "checkpoint-present",
	future: "checkpoint-future",
};

const LABEL_OFFSET_Y: Record<Era, number> = {
	past: 68,
	present: 108,
	future: 80,
};

export function makeCheckpoint(def: CheckpointDef, tileWidth: number, tileHeight: number) {
	const era = state.currentEra;
	const isActivated = state.checkpointId >= def.id;

	const checkpoint = k.add([
		k.sprite(CHECKPOINT_SPRITES[era], { frame: isActivated ? 1 : 0 }),
		k.pos(def.tx * tileWidth + tileWidth / 2, def.ty * tileHeight),
		k.anchor("bot"),
		k.area(),
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

		checkpoint.frame = 1;

		const accent = ERAS[era].accentColor;
		const label = k.add([
			k.text("CHECKPOINT SALVO", { size: 14 }),
			k.pos(checkpoint.pos.x, checkpoint.pos.y - LABEL_OFFSET_Y[era]),
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
