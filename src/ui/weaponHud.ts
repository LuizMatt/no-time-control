import { SCREEN_HEIGHT } from "../core/constants";
import { k } from "../core/k";
import { state } from "../core/state";
import { WEAPONS } from "../data/weapons";
import type { WeaponId } from "../types";

const SLOT_IDS: WeaponId[] = ["w1", "w2", "w3"];
const SLOT_SPRITES: Record<WeaponId, string> = {
	w1: "ui-weapon-axe",
	w2: "ui-weapon-pistol",
	w3: "ui-weapon-plasma",
};
const ICON_PX = 32;
const BASE_SCALE = 2;
const ACTIVE_SCALE = 2.4;
const FIRST_CENTER_X = 48;
const SLOT_STEP = 74;
const SLOT_BOTTOM_Y = SCREEN_HEIGHT - 30;
const LABEL_Y = SCREEN_HEIGHT - 18;
const HIGHLIGHT_PAD = 4;
const INACTIVE_TINT = 110;

/** Bottom-left HUD showing the 3 weapons (active one highlighted) or a wolf face while transformed. */
export function createWeaponHud(): void {
	const slotCenterX = (index: number): number => FIRST_CENTER_X + index * SLOT_STEP;

	const slots = SLOT_IDS.map((id, index) => {
		const x = slotCenterX(index);
		const highlight = k.add([
			k.rect(ICON_PX * ACTIVE_SCALE + HIGHLIGHT_PAD * 2, ICON_PX * ACTIVE_SCALE + HIGHLIGHT_PAD * 2, {
				radius: 3,
			}),
			k.pos(x, SLOT_BOTTOM_Y + HIGHLIGHT_PAD),
			k.anchor("bot"),
			k.color(...WEAPONS[id].color),
			k.opacity(0),
			k.fixed(),
			k.z(50),
		]);
		const icon = k.add([
			k.sprite(SLOT_SPRITES[id]),
			k.pos(x, SLOT_BOTTOM_Y),
			k.anchor("bot"),
			k.scale(BASE_SCALE),
			k.color(255, 255, 255),
			k.opacity(1),
			k.fixed(),
			k.z(51),
		]);
		const label = k.add([
			k.text(WEAPONS[id].key, { size: 12 }),
			k.pos(x, LABEL_Y),
			k.anchor("center"),
			k.color(245, 237, 186),
			k.opacity(1),
			k.fixed(),
			k.z(51),
		]);
		return { id, highlight, icon, label };
	});

	const wolfX = slotCenterX(1);
	const wolfIcon = k.add([
		k.sprite("ui-weapon-wolf"),
		k.pos(wolfX, SLOT_BOTTOM_Y),
		k.anchor("bot"),
		k.scale(ACTIVE_SCALE),
		k.color(255, 255, 255),
		k.opacity(0),
		k.fixed(),
		k.z(51),
	]);
	const wolfLabel = k.add([
		k.text("Q", { size: 12 }),
		k.pos(wolfX, LABEL_Y),
		k.anchor("center"),
		k.color(245, 237, 186),
		k.opacity(0),
		k.fixed(),
		k.z(51),
	]);

	k.onUpdate(() => {
		const wolf = state.transformed;

		for (const slot of slots) {
			const active = !wolf && slot.id === state.activeWeapon;
			const shown = !wolf;
			slot.highlight.opacity = active ? 1 : 0;
			slot.icon.opacity = shown ? 1 : 0;
			slot.label.opacity = shown ? 1 : 0;
			slot.icon.scale = k.vec2(active ? ACTIVE_SCALE : BASE_SCALE);
			const tint = active ? 255 : INACTIVE_TINT;
			slot.icon.color = k.rgb(tint, tint, tint);
		}

		wolfIcon.opacity = wolf ? 1 : 0;
		wolfLabel.opacity = wolf ? 1 : 0;
		if (wolf) {
			const pulse = 0.82 + 0.18 * Math.sin(k.time() * 12);
			wolfIcon.color = k.rgb(255, Math.round(255 * pulse), Math.round(255 * pulse));
		}
	});
}
