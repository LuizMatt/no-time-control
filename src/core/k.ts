import kaplay from "kaplay";

export const k = kaplay({
	width: 960,
	height: 540,
	letterbox: true,
	crisp: true,
	pixelDensity: 1,
	background: [10, 10, 16],
	texFilter: "nearest",
	global: false,
});
