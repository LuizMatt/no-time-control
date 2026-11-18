import {
	PLAYER_MAX_HP,
	SCREEN_HEIGHT,
	SCREEN_WIDTH,
	SPECIAL_MAX,
} from "../core/constants";
import { k } from "../core/k";
import { state } from "../core/state";
import { BOSSES } from "../data/bosses";
import { ERAS } from "../data/eras";
import { WEAPONS } from "../data/weapons";
import type { Era } from "../types";

const ERA_SHORT_LABEL: Record<Era, string> = {
	past: "Passado",
	present: "Presente",
	future: "Futuro",
};

/** Creates the fixed on-screen HUD (HP, special meter, era indicator, equipped weapon, and boss HP slot). */
export function createHud(): void {
	const eraConfig = ERAS[state.currentEra];

	// 1. Top-left: Player HP & Special Meter
	k.add([
		k.rect(240, 82, { radius: 6 }),
		k.pos(16, 14),
		k.color(10, 12, 20),
		k.outline(2, k.rgb(46, 52, 72)),
		k.opacity(0.86),
		k.fixed(),
		k.z(50),
	]);

	k.add([
		k.text("HP", { size: 13 }),
		k.pos(26, 23),
		k.color(210, 218, 232),
		k.fixed(),
		k.z(51),
	]);

	const hpSegments = Array.from({ length: PLAYER_MAX_HP }, (_, index) =>
		k.add([
			k.rect(24, 12, { radius: 2 }),
			k.pos(54 + index * 28, 23),
			k.color(85, 225, 130),
			k.fixed(),
			k.z(51),
		]),
	);

	const hpValueText = k.add([
		k.text(`${state.hp}/${state.maxHp}`, { size: 13 }),
		k.pos(244, 23),
		k.anchor("topright"),
		k.color(230, 236, 246),
		k.fixed(),
		k.z(51),
	]);

	const specialBarWidth = 218;
	k.add([
		k.rect(specialBarWidth, 12, { radius: 3 }),
		k.pos(26, 68),
		k.color(28, 32, 46),
		k.fixed(),
		k.z(51),
	]);

	const specialFill = k.add([
		k.rect(0, 12, { radius: 3 }),
		k.pos(26, 68),
		k.color(195, 115, 255),
		k.fixed(),
		k.z(52),
	]);

	const specialText = k.add([
		k.text("ESPECIAL: 0%", { size: 12 }),
		k.pos(26, 49),
		k.color(210, 190, 245),
		k.fixed(),
		k.z(52),
	]);

	// 2. Top-right: Active Era Indicator
	k.add([
		k.rect(210, 38, { radius: 6 }),
		k.pos(SCREEN_WIDTH - 16, 14),
		k.anchor("topright"),
		k.color(10, 12, 20),
		k.outline(2, k.rgb(...eraConfig.accentColor)),
		k.opacity(0.86),
		k.fixed(),
		k.z(50),
	]);

	k.add([
		k.text(`TEMPO: ${eraConfig.label}`, { size: 16 }),
		k.pos(SCREEN_WIDTH - 121, 33),
		k.anchor("center"),
		k.color(...eraConfig.accentColor),
		k.fixed(),
		k.z(51),
	]);

	// 3. Bottom-left: Equipped Weapon / Werewolf Claws
	const weaponBg = k.add([
		k.rect(200, 44, { radius: 5 }),
		k.pos(16, SCREEN_HEIGHT - 58),
		k.color(16, 20, 30),
		k.outline(2, k.rgb(...WEAPONS[state.activeWeapon].color)),
		k.opacity(0.9),
		k.fixed(),
		k.z(50),
	]);

	const weaponTitle = k.add([
		k.text("", { size: 13 }),
		k.pos(28, SCREEN_HEIGHT - 48),
		k.color(...WEAPONS[state.activeWeapon].color),
		k.fixed(),
		k.z(51),
	]);

	const weaponSubtitle = k.add([
		k.text("", { size: 10 }),
		k.pos(28, SCREEN_HEIGHT - 30),
		k.color(175, 184, 200),
		k.fixed(),
		k.z(51),
	]);

	// 4. Bottom-center: Boss HP Slot (hidden until state.bossActive === true in Milestone 5)
	const bossBarWidth = 420;
	const bossBg = k.add([
		k.rect(bossBarWidth + 20, 42, { radius: 6 }),
		k.pos(SCREEN_WIDTH / 2, SCREEN_HEIGHT - 14),
		k.anchor("bot"),
		k.color(10, 12, 20),
		k.outline(2, k.rgb(180, 55, 75)),
		k.opacity(0),
		k.fixed(),
		k.z(50),
	]);

	const bossTitle = k.add([
		k.text("BOSS", { size: 12 }),
		k.pos(SCREEN_WIDTH / 2, SCREEN_HEIGHT - 44),
		k.anchor("center"),
		k.color(255, 210, 215),
		k.opacity(0),
		k.fixed(),
		k.z(51),
	]);

	const bossTrack = k.add([
		k.rect(bossBarWidth, 10, { radius: 3 }),
		k.pos(SCREEN_WIDTH / 2 - bossBarWidth / 2, SCREEN_HEIGHT - 30),
		k.color(36, 24, 30),
		k.opacity(0),
		k.fixed(),
		k.z(51),
	]);

	const bossFill = k.add([
		k.rect(bossBarWidth, 10, { radius: 3 }),
		k.pos(SCREEN_WIDTH / 2 - bossBarWidth / 2, SCREEN_HEIGHT - 30),
		k.color(230, 65, 90),
		k.opacity(0),
		k.fixed(),
		k.z(52),
	]);

	const currentBossDef = BOSSES[eraConfig.bossId];
	let bossHpRatio = 1;
	let bossLabel = currentBossDef
		? `${currentBossDef.name.toUpperCase()} \\[${eraConfig.label}\\]`
		: "BOSS";

	k.on("boss:updated", "boss", (_obj, payload: { hp: number; maxHp: number; name: string; era: Era }) => {
		if (!payload) return;
		bossHpRatio = Math.max(0, Math.min(1, payload.hp / Math.max(1, payload.maxHp)));
		bossLabel = `${payload.name.toUpperCase()} \\[${ERAS[payload.era].label}\\]`;
	});

	k.onUpdate(() => {
		// Sync HP segments
		const isLowHp = state.hp <= 2;
		for (let i = 0; i < hpSegments.length; i++) {
			const filled = i < state.hp;
			hpSegments[i].color = filled
				? isLowHp
					? k.rgb(235, 75, 90)
					: k.rgb(85, 225, 130)
				: k.rgb(38, 42, 56);
		}
		hpValueText.text = `${state.hp}/${state.maxHp}`;

		// Sync Special Meter
		const ratio = Math.max(0, Math.min(1, state.special / SPECIAL_MAX));
		specialFill.width = specialBarWidth * ratio;

		if (state.transformed) {
			const pulse = 0.75 + 0.25 * Math.sin(k.time() * 12);
			specialFill.color = k.rgb(255, Math.round(70 * pulse), Math.round(115 * pulse));
			specialText.text = "MODO LOBISOMEM ATIVO";
			specialText.color = k.rgb(255, 130, 160);
		} else if (state.special >= SPECIAL_MAX) {
			const blink = Math.floor(k.time() * 6) % 2 === 0;
			specialFill.color = blink ? k.rgb(255, 215, 85) : k.rgb(255, 95, 130);
			specialText.text = "PRONTO! \\[Q\\] LOBISOMEM";
			specialText.color = blink ? k.rgb(255, 235, 120) : k.rgb(255, 140, 165);
		} else {
			specialFill.color = k.rgb(195, 115, 255);
			specialText.text = `ESPECIAL: ${Math.floor(ratio * 100)}%`;
			specialText.color = k.rgb(210, 190, 245);
		}

		// Sync Equipped Weapon / Claws
		if (state.transformed) {
			weaponBg.color = k.rgb(115, 18, 42);
			weaponBg.outline.color = k.rgb(255, 95, 130);
			weaponTitle.text = "GARRAS ATIVAS";
			weaponTitle.color = k.rgb(255, 230, 238);
			weaponSubtitle.text = "100% dano em qualquer Era";
			weaponSubtitle.color = k.rgb(255, 190, 205);
		} else {
			const weapon = WEAPONS[state.activeWeapon];
			const kindLabel =
				weapon.kind === "melee" ? "Corpo a corpo" : weapon.piercing ? "Perfurante" : "Tiro reto";
			weaponBg.color = k.rgb(16, 20, 30);
			weaponBg.outline.color = k.rgb(...weapon.color);
			weaponTitle.text = `\\[${weapon.key}\\] ${weapon.name}`;
			weaponTitle.color = k.rgb(...weapon.color);
			weaponSubtitle.text = `${ERA_SHORT_LABEL[weapon.era]} • ${kindLabel}`;
			weaponSubtitle.color = k.rgb(175, 184, 200);
		}

		// Sync Boss HP slot visibility
		const showBoss = state.bossActive;
		bossBg.opacity = showBoss ? 0.88 : 0;
		bossTitle.opacity = showBoss ? 1 : 0;
		bossTrack.opacity = showBoss ? 1 : 0;
		bossFill.opacity = showBoss ? 1 : 0;
		if (showBoss) {
			bossTitle.text = bossLabel;
			bossFill.width = bossBarWidth * bossHpRatio;
		}
	});
}
