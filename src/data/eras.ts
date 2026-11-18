import type { Era, EraConfig } from "../types";

export const ERAS: Record<Era, EraConfig> = {
	past: {
		id: "past",
		label: "PASSADO",
		subtitle: "Era Primitiva",
		tint: [46, 30, 18],
		platformColor: [118, 78, 44],
		accentColor: [242, 178, 76],
		weapon: "w1",
		enemyPool: ["past_grunt", "past_brute"],
		bossId: "boss_past",
	},
	present: {
		id: "present",
		label: "PRESENTE",
		subtitle: "Era Urbana",
		tint: [22, 34, 52],
		platformColor: [74, 96, 122],
		accentColor: [110, 196, 255],
		weapon: "w2",
		enemyPool: ["present_shooter", "present_drone"],
		bossId: "boss_present",
	},
	future: {
		id: "future",
		label: "FUTURO",
		subtitle: "Era Cibernética",
		tint: [18, 12, 36],
		platformColor: [44, 98, 114],
		accentColor: [0, 255, 224],
		weapon: "w3",
		enemyPool: ["future_stalker", "future_turret"],
		bossId: "boss_future",
	},
};
