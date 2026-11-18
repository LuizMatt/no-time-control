import { loadAssets } from "../core/assets";
import { k } from "../core/k";
import { resetRun } from "../core/state";
import { pickEra } from "../systems/eraDirector";

/** Registers the boot scene that loads assets and initializes the run. */
export function registerBootScene(): void {
	k.scene("boot", () => {
		loadAssets();
		resetRun();
		pickEra();
		k.go("stage");
	});
}
