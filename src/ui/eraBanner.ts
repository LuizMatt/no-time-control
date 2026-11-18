import { SCREEN_WIDTH } from "../core/constants";
import { k } from "../core/k";
import { ERAS } from "../data/eras";
import type { Era } from "../types";

const BANNER_HOLD_TIME = 1.3;
const BANNER_FADE_TIME = 0.5;

/** Displays a centered high-impact banner at the top of the screen for the active era. */
export function showEraBanner(era: Era): void {
	const config = ERAS[era];
	const weaponKey = config.weapon.replace("w", "");

	const panelWidth = 460;
	const panelHeight = 76;
	const centerX = SCREEN_WIDTH / 2;
	const topY = 58;

	const bg = k.add([
		k.rect(panelWidth, panelHeight, { radius: 8 }),
		k.pos(centerX, topY),
		k.anchor("center"),
		k.color(8, 10, 16),
		k.outline(2, k.rgb(...config.accentColor)),
		k.opacity(0.88),
		k.fixed(),
		k.z(100),
	]);

	const title = k.add([
		k.text(`TEMPO: ${config.label}`, { size: 28 }),
		k.pos(centerX, topY - 12),
		k.anchor("center"),
		k.color(...config.accentColor),
		k.opacity(1),
		k.fixed(),
		k.z(101),
	]);

	const subtitle = k.add([
		k.text(`${config.subtitle}  •  Arma eficaz: \\[${weaponKey}\\]`, { size: 15 }),
		k.pos(centerX, topY + 18),
		k.anchor("center"),
		k.color(230, 234, 242),
		k.opacity(1),
		k.fixed(),
		k.z(101),
	]);

	k.wait(BANNER_HOLD_TIME, () => {
		if (!bg.exists()) return;

		k.tween(
			1,
			0,
			BANNER_FADE_TIME,
			(progress) => {
				if (bg.exists()) bg.opacity = 0.88 * progress;
				if (title.exists()) title.opacity = progress;
				if (subtitle.exists()) subtitle.opacity = progress;
			},
			k.easings.easeOutQuad,
		).onEnd(() => {
			if (bg.exists()) k.destroy(bg);
			if (title.exists()) k.destroy(title);
			if (subtitle.exists()) k.destroy(subtitle);
		});
	});
}
