import type { AudioPlay } from "kaplay";
import {
	DEFAULT_MUSIC_LEVEL,
	DEFAULT_SFX_LEVEL,
	MUSIC_MASTER_VOLUME,
	SFX_MASTER_VOLUME,
} from "./constants";
import { k } from "./k";

export type SfxId =
	| "sfx-shot"
	| "sfx-axe"
	| "sfx-plasma"
	| "sfx-boss-future-plasma"
	| "sfx-teleport"
	| "sfx-hit"
	| "sfx-dash"
	| "sfx-burst"
	| "sfx-turret-plasma"
	| "sfx-past-mob-hit"
	| "sfx-checkpoint"
	| "sfx-transform"
	| "sfx-werewolf-attack"
	| "sfx-type"
	| "sfx-type-loop";

export interface SfxOptions {
	volume?: number;
	detune?: number;
	speed?: number;
}

export interface AudioSettings {
	musicLevel: number;
	sfxLevel: number;
	musicMuted: boolean;
	sfxMuted: boolean;
}

const STORAGE_KEY = "no-time-control:audio";

function clamp01(value: number): number {
	return Math.max(0, Math.min(1, value));
}

function loadStoredSettings(): AudioSettings {
	const defaults: AudioSettings = {
		musicLevel: DEFAULT_MUSIC_LEVEL,
		sfxLevel: DEFAULT_SFX_LEVEL,
		musicMuted: false,
		sfxMuted: false,
	};
	try {
		const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
		if (!raw) return defaults;
		const parsed = JSON.parse(raw) as Partial<AudioSettings>;
		return {
			musicLevel:
				typeof parsed.musicLevel === "number"
					? clamp01(parsed.musicLevel)
					: defaults.musicLevel,
			sfxLevel:
				typeof parsed.sfxLevel === "number"
					? clamp01(parsed.sfxLevel)
					: defaults.sfxLevel,
			musicMuted: Boolean(parsed.musicMuted),
			sfxMuted: Boolean(parsed.sfxMuted),
		};
	} catch {
		return defaults;
	}
}

const settings: AudioSettings = loadStoredSettings();

function persistSettings(): void {
	try {
		globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(settings));
	} catch {
		// Ignore storage errors in restricted contexts
	}
}

let activeMusicId: string | null = null;
let activeMusicBaseVolume = 1;
let activeMusicFadeMult = 1;
let activeMusicFadeTimer: ReturnType<typeof setInterval> | null = null;
let activeMusicHandle: AudioPlay | null = null;

function clearMusicFade(): void {
	if (activeMusicFadeTimer !== null) {
		clearInterval(activeMusicFadeTimer);
		activeMusicFadeTimer = null;
	}
}

function computeMusicGain(): number {
	if (settings.musicMuted) return 0;
	return clamp01(
		activeMusicBaseVolume *
			activeMusicFadeMult *
			settings.musicLevel *
			MUSIC_MASTER_VOLUME,
	);
}

function applyMusicVolume(): void {
	if (!activeMusicHandle) return;
	try {
		activeMusicHandle.volume = computeMusicGain();
	} catch {
		// Ignore if audio handle is already disposed
	}
}

/** Returns a snapshot of the current audio volume and mute settings. */
export function getAudioSettings(): AudioSettings {
	return { ...settings };
}

/** Updates the normalized music volume (0..1) and applies it immediately. */
export function setMusicLevel(level: number): void {
	settings.musicLevel = clamp01(Math.round(level * 20) / 20);
	if (settings.musicLevel > 0 && settings.musicMuted) {
		settings.musicMuted = false;
	}
	persistSettings();
	applyMusicVolume();
}

/** Updates the normalized SFX volume (0..1). */
export function setSfxLevel(level: number): void {
	settings.sfxLevel = clamp01(Math.round(level * 20) / 20);
	if (settings.sfxLevel > 0 && settings.sfxMuted) {
		settings.sfxMuted = false;
	}
	persistSettings();
}

/** Toggles music mute state and applies it immediately. */
export function toggleMusicMute(): boolean {
	settings.musicMuted = !settings.musicMuted;
	persistSettings();
	applyMusicVolume();
	return settings.musicMuted;
}

/** Toggles SFX mute state. */
export function toggleSfxMute(): boolean {
	settings.sfxMuted = !settings.sfxMuted;
	persistSettings();
	return settings.sfxMuted;
}

/** Plays a registered sound effect scaled by the current SFX volume. */
export function playSfx(id: SfxId, opts: SfxOptions = {}): void {
	if (settings.sfxMuted || settings.sfxLevel <= 0) return;
	try {
		const volume = clamp01(
			(opts.volume ?? 1) * settings.sfxLevel * SFX_MASTER_VOLUME,
		);
		k.play(id, {
			volume,
			detune: opts.detune,
			speed: opts.speed,
		});
	} catch {
		// Ignore playback errors when audio context is not unlocked or in headless tests
	}
}

/** Plays a registered sound effect in a loop and returns its handle so the caller can stop it. */
export function playLoopingSfx(
	id: SfxId,
	opts: SfxOptions = {},
): AudioPlay | null {
	if (settings.sfxMuted || settings.sfxLevel <= 0) return null;
	try {
		const volume = clamp01(
			(opts.volume ?? 1) * settings.sfxLevel * SFX_MASTER_VOLUME,
		);
		return k.play(id, {
			loop: true,
			volume,
			detune: opts.detune,
			speed: opts.speed,
		});
	} catch {
		return null;
	}
}

/** Starts a looping background music track, stopping any previous track. */
export function playMusic(trackId: string, volume = 1): void {
	clearMusicFade();
	activeMusicFadeMult = 1;
	if (activeMusicId === trackId && activeMusicHandle && !activeMusicHandle.paused) {
		activeMusicBaseVolume = volume;
		applyMusicVolume();
		return;
	}
	stopMusic();
	try {
		activeMusicId = trackId;
		activeMusicBaseVolume = volume;
		activeMusicFadeMult = 1;
		// Kaplay's loadMusic playback ignores opts.volume on init, so start paused,
		// apply volume first, then unpause to avoid a 100% volume blast.
		activeMusicHandle = k.play(trackId, {
			loop: true,
			paused: true,
		});
		applyMusicVolume();
		activeMusicHandle.paused = false;
	} catch {
		activeMusicId = null;
		activeMusicHandle = null;
	}
}

/** Smoothly fades out the currently playing music over durationSec seconds, then stops it. */
export function fadeOutMusic(durationSec = 1.5): void {
	if (!activeMusicHandle) return;
	clearMusicFade();

	if (durationSec <= 0) {
		stopMusic();
		return;
	}

	const startFade = activeMusicFadeMult;
	const startTime = Date.now();
	const durationMs = durationSec * 1000;

	activeMusicFadeTimer = setInterval(() => {
		const elapsed = Date.now() - startTime;
		const progress = Math.min(1, elapsed / durationMs);
		activeMusicFadeMult = startFade * (1 - progress);
		applyMusicVolume();

		if (progress >= 1) {
			stopMusic();
		}
	}, 30);
}

/** Stops the currently playing background music track, if any. */
export function stopMusic(): void {
	clearMusicFade();
	activeMusicFadeMult = 1;
	if (activeMusicHandle) {
		try {
			activeMusicHandle.stop();
		} catch {
			// Ignore stop errors if already disposed
		}
	}
	activeMusicId = null;
	activeMusicHandle = null;
}
