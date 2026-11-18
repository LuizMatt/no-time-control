import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../core/constants";
import { k } from "../core/k";
import { prepareCheckpointRespawn, state } from "../core/state";
import { ERAS } from "../data/eras";
import { applyEra, pickDifferentEra } from "../systems/eraDirector";

/** Registers the main playable stage scene. */
export function registerStageScene(): void {
	k.scene("stage", () => {
		applyEra(state.currentEra);

		const config = ERAS[state.currentEra];

		// Temporary debug info and respawn shortcut to test era switching in Milestone 1
		k.add([
			k.text(
				`Era atual: ${config.label}  |  Mortes: ${state.deaths}  |  Pressione \\[R\\] para simular morte no checkpoint`,
				{ size: 14 },
			),
			k.pos(SCREEN_WIDTH / 2, SCREEN_HEIGHT - 28),
			k.anchor("center"),
			k.color(210, 215, 225),
			k.fixed(),
			k.z(50),
		]);

		k.onKeyPress("r", () => {
			const nextEra = pickDifferentEra(state.currentEra);
			prepareCheckpointRespawn(nextEra);
			k.go("stage");
		});
	});
}
