import type { GameObj, KEventController } from "kaplay";
import { SCREEN_WIDTH } from "../core/constants";
import { k } from "../core/k";
import type { DialogueLine } from "../types";

const TYPEWRITER_CHARS_PER_SEC = 48;

// Official 16-color palette RGB triplets
const COL_K: [number, number, number] = [31, 14, 28]; // #1f0e1c
const COL_P: [number, number, number] = [62, 33, 55]; // #3e2137
const COL_S: [number, number, number] = [88, 69, 99]; // #584563
const COL_L: [number, number, number] = [140, 143, 174]; // #8c8fae
const COL_W: [number, number, number] = [245, 237, 186]; // #f5edba
const COL_R: [number, number, number] = [157, 48, 59]; // #9d303b
const COL_C: [number, number, number] = [210, 100, 113]; // #d26471
const COL_V: [number, number, number] = [112, 55, 127]; // #70377f

/**
 * Renders the bottom dialogue box with typewriter effect, speaker badges
 * for Jubileu and Mago do Tempo, and Space/Enter/Click progression.
 */
export function startDialogue(
	lines: DialogueLine[],
	onComplete: () => void,
): void {
	if (lines.length === 0) {
		onComplete();
		return;
	}

	const uiObjects: GameObj[] = [];
	const listeners: KEventController[] = [];
	let badgeObjects: GameObj[] = [];

	const trackObj = <T extends GameObj>(obj: T): T => {
		uiObjects.push(obj);
		return obj;
	};

	const trackBadge = <T extends GameObj>(obj: T): T => {
		badgeObjects.push(obj);
		return obj;
	};

	const clearBadge = (): void => {
		for (const obj of badgeObjects) {
			if (obj.exists()) obj.destroy();
		}
		badgeObjects = [];
	};

	const boxX = 24;
	const boxY = 348;
	const boxW = SCREEN_WIDTH - 48; // 912
	const boxH = 176;

	// Outer dark backdrop under cutscene
	trackObj(
		k.add([
			k.rect(SCREEN_WIDTH, 204),
			k.pos(0, 336),
			k.color(...COL_K),
			k.fixed(),
			k.z(50),
		]),
	);

	// Outer dialogue frame
	trackObj(
		k.add([
			k.rect(boxW, boxH, { radius: 6 }),
			k.pos(boxX, boxY),
			k.color(...COL_K),
			k.outline(2, k.rgb(...COL_S)),
			k.area(),
			k.fixed(),
			k.z(51),
			"dialogueBox",
		]),
	);

	// Inner subtle border
	trackObj(
		k.add([
			k.rect(boxW - 8, boxH - 8, { radius: 4 }),
			k.pos(boxX + 4, boxY + 4),
			k.color(...COL_K),
			k.outline(1, k.rgb(...COL_P)),
			k.fixed(),
			k.z(52),
		]),
	);

	// Corner pixel ornaments
	const corners: Array<[number, number]> = [
		[boxX + 4, boxY + 4],
		[boxX + boxW - 12, boxY + 4],
		[boxX + 4, boxY + boxH - 12],
		[boxX + boxW - 12, boxY + boxH - 12],
	];
	for (const [cx, cy] of corners) {
		trackObj(
			k.add([
				k.rect(8, 2),
				k.pos(cx, cy),
				k.color(...COL_L),
				k.fixed(),
				k.z(53),
			]),
		);
	}

	// Main dialogue text object
	const bodyText = trackObj(
		k.add([
			k.text("", { size: 19, width: boxW - 104, lineSpacing: 8 }),
			k.pos(boxX + 52, boxY + 66),
			k.color(...COL_W),
			k.fixed(),
			k.z(55),
		]),
	);

	// Step progress indicator (e.g. 1/4)
	const stepCounterText = trackObj(
		k.add([
			k.text("", { size: 12 }),
			k.pos(boxX + boxW - 24, boxY + 22),
			k.anchor("right"),
			k.color(...COL_L),
			k.fixed(),
			k.z(55),
		]),
	);

	// Footer controls hint
	trackObj(
		k.add([
			k.text("[ESPAÇO] Avançar   [TAB / ESC] Pular", { size: 12 }),
			k.pos(boxX + 52, boxY + boxH - 20),
			k.color(...COL_S),
			k.fixed(),
			k.z(55),
		]),
	);

	// Animated next-line triangle indicator (pixel-art stepped arrow)
	const arrowBaseX = boxX + boxW - 30;
	const arrowBaseY = boxY + boxH - 26;
	const arrowRow1 = trackObj(
		k.add([
			k.rect(14, 3),
			k.pos(arrowBaseX, arrowBaseY),
			k.anchor("center"),
			k.color(...COL_W),
			k.opacity(0),
			k.fixed(),
			k.z(56),
		]),
	);
	const arrowRow2 = trackObj(
		k.add([
			k.rect(8, 3),
			k.pos(arrowBaseX, arrowBaseY + 3),
			k.anchor("center"),
			k.color(...COL_W),
			k.opacity(0),
			k.fixed(),
			k.z(56),
		]),
	);
	const arrowRow3 = trackObj(
		k.add([
			k.rect(4, 3),
			k.pos(arrowBaseX, arrowBaseY + 6),
			k.anchor("center"),
			k.color(...COL_W),
			k.opacity(0),
			k.fixed(),
			k.z(56),
		]),
	);

	const renderSpeakerBadge = (speaker: string): void => {
		clearBadge();
		const isMage = speaker.toLowerCase().includes("mago");
		const badgeFill = isMage ? COL_P : COL_R;
		const badgeOutline = isMage ? COL_V : COL_C;
		const badgeX = isMage ? boxX + 56 : boxX + 44;
		const badgeY = boxY + 18;
		const badgeW = isMage ? 176 : 136;
		const badgeH = 26;

		if (isMage) {
			// Arcane diamond emblem on the left of Mago do Tempo's badge
			const emblemX = boxX + 36;
			const emblemY = badgeY + badgeH / 2;
			trackBadge(
				k.add([
					k.rect(18, 18),
					k.pos(emblemX, emblemY),
					k.anchor("center"),
					k.rotate(45),
					k.color(...COL_P),
					k.outline(2, k.rgb(...COL_V)),
					k.fixed(),
					k.z(55),
				]),
			);
			trackBadge(
				k.add([
					k.rect(6, 10),
					k.pos(emblemX, emblemY),
					k.anchor("center"),
					k.color(...COL_W),
					k.fixed(),
					k.z(56),
				]),
			);
		}

		// Horizontal divider line extending across the dialogue box
		trackBadge(
			k.add([
				k.rect(boxW - 96, 2),
				k.pos(badgeX, badgeY + badgeH / 2),
				k.color(...badgeOutline),
				k.opacity(0.45),
				k.fixed(),
				k.z(53),
			]),
		);

		// Speaker pill tag
		trackBadge(
			k.add([
				k.rect(badgeW, badgeH, { radius: 4 }),
				k.pos(badgeX, badgeY),
				k.color(...badgeFill),
				k.outline(2, k.rgb(...badgeOutline)),
				k.fixed(),
				k.z(54),
			]),
		);

		// Speaker name text
		trackBadge(
			k.add([
				k.text(speaker, { size: 15 }),
				k.pos(badgeX + badgeW / 2, badgeY + badgeH / 2),
				k.anchor("center"),
				k.color(...COL_W),
				k.fixed(),
				k.z(55),
			]),
		);
	};

	let currentIndex = 0;
	let charCount = 0;
	let isLineComplete = false;
	let finished = false;
	let inputGuardTimer = 0.12;

	const showLine = (index: number): void => {
		const line = lines[index];
		renderSpeakerBadge(line.speaker);
		charCount = 0;
		isLineComplete = false;
		bodyText.text = "";
		stepCounterText.text = `${index + 1} / ${lines.length}`;
	};

	const cleanupAndFinish = (): void => {
		if (finished) return;
		finished = true;
		for (const ctrl of listeners) {
			ctrl.cancel();
		}
		clearBadge();
		for (const obj of uiObjects) {
			if (obj.exists()) obj.destroy();
		}
		onComplete();
	};

	const handleAdvance = (): void => {
		if (finished || inputGuardTimer > 0) return;
		const currentLine = lines[currentIndex];
		if (!isLineComplete) {
			charCount = currentLine.text.length;
			bodyText.text = currentLine.text;
			isLineComplete = true;
			return;
		}

		currentIndex += 1;
		if (currentIndex >= lines.length) {
			cleanupAndFinish();
		} else {
			showLine(currentIndex);
		}
	};

	showLine(0);

	listeners.push(
		k.onUpdate(() => {
			if (finished) return;
			const dt = k.dt();
			if (inputGuardTimer > 0) {
				inputGuardTimer = Math.max(0, inputGuardTimer - dt);
			}

			const currentLine = lines[currentIndex];
			if (!isLineComplete) {
				charCount = Math.min(
					currentLine.text.length,
					charCount + TYPEWRITER_CHARS_PER_SEC * dt,
				);
				const shown = Math.floor(charCount);
				bodyText.text = currentLine.text.slice(0, shown);
				if (shown >= currentLine.text.length) {
					isLineComplete = true;
				}
			}

			const bob = Math.sin(k.time() * 7) * 2.5;
			const arrowOpacity = isLineComplete ? 1 : 0;
			arrowRow1.pos.y = arrowBaseY + bob;
			arrowRow2.pos.y = arrowBaseY + 3 + bob;
			arrowRow3.pos.y = arrowBaseY + 6 + bob;
			arrowRow1.opacity = arrowOpacity;
			arrowRow2.opacity = arrowOpacity;
			arrowRow3.opacity = arrowOpacity;
		}),
	);

	listeners.push(k.onKeyPress("space", handleAdvance));
	listeners.push(k.onKeyPress("enter", handleAdvance));
	listeners.push(k.onClick("dialogueBox", handleAdvance));
	listeners.push(k.onKeyPress("tab", cleanupAndFinish));
	listeners.push(k.onKeyPress("escape", cleanupAndFinish));
}
