import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import zlib from "node:zlib";

const ALLOWED_HEX = new Set([
	"#00000000",
	"#1f0e1c",
	"#3e2137",
	"#584563",
	"#8c8fae",
	"#9a6348",
	"#d79b7d",
	"#f5edba",
	"#647d34",
	"#c0c741",
	"#e4943a",
	"#9d303b",
	"#d26471",
	"#70377f",
	"#17434b",
	"#34859d",
	"#7ec4c1",
]);

function decodePngRgba(buf: Buffer): { width: number; height: number; rgba: Buffer } {
	const width = buf.readUInt32BE(16);
	const height = buf.readUInt32BE(20);
	const idatChunks: Buffer[] = [];
	let offset = 8;
	while (offset < buf.length) {
		const len = buf.readUInt32BE(offset);
		const type = buf.toString("ascii", offset + 4, offset + 8);
		if (type === "IDAT") {
			idatChunks.push(buf.subarray(offset + 8, offset + 8 + len));
		}
		offset += 12 + len;
	}
	const raw = zlib.inflateSync(Buffer.concat(idatChunks));
	const stride = width * 4;
	const rgba = Buffer.alloc(height * stride);
	for (let y = 0; y < height; y++) {
		const filter = raw[y * (stride + 1)];
		assert.equal(filter, 0, "Expected filter type 0 for pixel-art PNG");
		raw.copy(rgba, y * stride, y * (stride + 1) + 1, (y + 1) * (stride + 1));
	}
	return { width, height, rgba };
}

test("intro-cutscene.png exists, is 320x112, and uses only the locked 16-color palette", () => {
	const filePath = path.resolve("public/sprites/intro-cutscene.png");
	assert.ok(fs.existsSync(filePath), "public/sprites/intro-cutscene.png must exist");
	const buf = fs.readFileSync(filePath);
	const { width, height, rgba } = decodePngRgba(buf);
	assert.equal(width, 320);
	assert.equal(height, 112);

	for (let i = 0; i < rgba.length; i += 4) {
		const r = rgba[i];
		const g = rgba[i + 1];
		const b = rgba[i + 2];
		const a = rgba[i + 3];
		const hex =
			a === 0
				? "#00000000"
				: `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
		assert.ok(ALLOWED_HEX.has(hex), `Disallowed color ${hex} at pixel ${i / 4}`);
	}
});
