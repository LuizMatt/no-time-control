import { loadAssets } from "../core/assets";
import { k } from "../core/k";
import { resetRun } from "../core/state";

/** Registers the boot scene that loads assets and transitions to the intro Play/cutscene screen. */
export function registerBootScene(): void {
	k.scene("boot", () => {
		loadAssets();
		resetRun();
		k.go("intro");
	});
}
