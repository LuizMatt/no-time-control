import type { Era } from "../types";

export interface ParallaxLayerDef {
	sprite: string;
	width: number;
	height: number;
	scale: number;
	z: number;
	speedX: number;
	speedY: number;
	driftX?: number;
	align: "top" | "bottom";
	offsetY: number;
	fillBelowColor?: readonly [number, number, number];
}

export const ERA_PARALLAX: Partial<Record<Era, readonly ParallaxLayerDef[]>> = {
	past: [
		{
			sprite: "past-bg-sky",
			width: 480,
			height: 160,
			scale: 2,
			z: -96,
			speedX: 0.01,
			speedY: 0.01,
			align: "top",
			offsetY: 0,
			fillBelowColor: [0x58, 0x45, 0x63],
		},
		{
			sprite: "past-bg-clouds",
			width: 240,
			height: 120,
			scale: 2,
			z: -95,
			speedX: 0.04,
			speedY: 0.02,
			driftX: -5,
			align: "top",
			offsetY: 0,
		},
		{
			sprite: "past-bg-far-mountains",
			width: 320,
			height: 160,
			scale: 2,
			z: -92,
			speedX: 0.12,
			speedY: 0.05,
			align: "bottom",
			offsetY: 0,
		},
		{
			sprite: "past-bg-mid-mountains",
			width: 240,
			height: 140,
			scale: 2,
			z: -89,
			speedX: 0.22,
			speedY: 0.1,
			align: "bottom",
			offsetY: 0,
		},
		{
			sprite: "past-bg-forest",
			width: 240,
			height: 110,
			scale: 2,
			z: -86,
			speedX: 0.34,
			speedY: 0.14,
			align: "bottom",
			offsetY: 0,
		},
		{
			sprite: "past-bg-near-pines",
			width: 240,
			height: 130,
			scale: 2,
			z: -83,
			speedX: 0.48,
			speedY: 0.18,
			align: "bottom",
			offsetY: 0,
		},
	],
	present: [
		{
			sprite: "present-bg-sky",
			width: 240,
			height: 120,
			scale: 2,
			z: -95,
			speedX: 0.06,
			speedY: 0.02,
			driftX: -6,
			align: "top",
			offsetY: 0,
			fillBelowColor: [0x17, 0x43, 0x4b],
		},
		{
			sprite: "present-bg-far",
			width: 240,
			height: 160,
			scale: 2,
			z: -90,
			speedX: 0.2,
			speedY: 0.08,
			align: "bottom",
			offsetY: 0,
		},
		{
			sprite: "present-bg-near",
			width: 240,
			height: 150,
			scale: 2,
			z: -85,
			speedX: 0.4,
			speedY: 0.16,
			align: "bottom",
			offsetY: 0,
		},
	],
	future: [
		{
			sprite: "future-bg-sky",
			width: 240,
			height: 150,
			scale: 2,
			z: -96,
			speedX: 0.03,
			speedY: 0.02,
			align: "top",
			offsetY: 0,
			fillBelowColor: [0x70, 0x37, 0x7f],
		},
		{
			sprite: "future-bg-far-towers",
			width: 240,
			height: 185,
			scale: 2,
			z: -92,
			speedX: 0.12,
			speedY: 0.05,
			align: "bottom",
			offsetY: 0,
		},
		{
			sprite: "future-bg-mid-scaffolding",
			width: 240,
			height: 155,
			scale: 2,
			z: -88,
			speedX: 0.25,
			speedY: 0.1,
			align: "bottom",
			offsetY: 0,
		},
		{
			sprite: "future-bg-near-industrial",
			width: 240,
			height: 135,
			scale: 2,
			z: -84,
			speedX: 0.42,
			speedY: 0.16,
			align: "bottom",
			offsetY: 0,
		},
	],
};
