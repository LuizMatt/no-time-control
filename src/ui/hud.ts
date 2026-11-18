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
import type { Era } from "../types";

/** Creates the clean on-screen HUD (hearts, compact special bar, and boss HP bar when active). */
export function createHud(): void {
	const eraConfig = ERAS[state.currentEra];

	// 1. Top-left: Only Hearts + clean Special Bar underneath
	const hpHearts = Array.from({ length: PLAYER_MAX_HP }, (_, index) =>
		k.add([
			k.sprite("hearts", { frame: index < state.hp ? 0 : 11 }),
			k.pos(20 + index * 28, 18),
			k.scale(2),
			k.fixed(),
			k.z(51),
		]),
	);

	let lastTrackedHp = state.hp;

	const specialBarWidth = PLAYER_MAX_HP * 28 - 4;
	k.add([
		k.rect(specialBarWidth, 6, { radius: 2 }),
		k.pos(20, 46),
		k.color(24, 28, 40),
		k.outline(1, k.rgb(48, 56, 78)),
		k.fixed(),
		k.z(51),
	]);

	const specialFill = k.add([
		k.rect(0, 6, { radius: 2 }),
		k.pos(20, 46),
		k.color(195, 115, 255),
		k.fixed(),
		k.z(52),
	]);

	// 2. Bottom-center: Boss HP Slot (hidden until state.bossActive === true)
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
		// Sync HP hearts with break animation when taking damage
		if (state.hp < lastTrackedHp) {
			for (let i = state.hp; i < lastTrackedHp; i++) {
				if (hpHearts[i]) {
					hpHearts[i].play("break");
				}
			}
			lastTrackedHp = state.hp;
		} else if (state.hp > lastTrackedHp) {
			for (let i = 0; i < hpHearts.length; i++) {
				hpHearts[i].stop();
				hpHearts[i].frame = i < state.hp ? 0 : 11;
			}
			lastTrackedHp = state.hp;
		}

		// Sync Special Meter
		const ratio = Math.max(0, Math.min(1, state.special / SPECIAL_MAX));
		specialFill.width = Math.round(specialBarWidth * ratio);

		if (state.transformed) {
			const pulse = 0.75 + 0.25 * Math.sin(k.time() * 12);
			specialFill.color = k.rgb(255, Math.round(70 * pulse), Math.round(115 * pulse));
		} else if (state.special >= SPECIAL_MAX) {
			const blink = Math.floor(k.time() * 6) % 2 === 0;
			specialFill.color = blink ? k.rgb(255, 215, 85) : k.rgb(255, 95, 130);
		} else {
			specialFill.color = k.rgb(195, 115, 255);
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
