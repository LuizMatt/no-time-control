import assert from "node:assert/strict";
import test from "node:test";
import { STORY } from "../src/data/story.ts";

test("STORY.intro has the 4 dialogue lines in exact order between Jubileu and Mago do Tempo", () => {
	assert.equal(STORY.intro.length, 4);
	assert.equal(STORY.intro[0].speaker, "Jubileu");
	assert.match(STORY.intro[0].text, /Sendo bem sincero/i);
	assert.equal(STORY.intro[1].speaker, "Mago do Tempo");
	assert.match(STORY.intro[1].text, /medicamentos/i);
	assert.equal(STORY.intro[2].speaker, "Jubileu");
	assert.match(STORY.intro[2].text, /manter no presente/i);
	assert.equal(STORY.intro[3].speaker, "Mago do Tempo");
	assert.match(STORY.intro[3].text, /Quem está no controle, você ou o tempo\?/i);
});

test("STORY.ending has closing lines between Mago do Tempo and Jubileu", () => {
	assert.equal(STORY.ending.length, 4);
	assert.equal(STORY.ending[0].speaker, "Mago do Tempo");
	assert.equal(STORY.ending[1].speaker, "Jubileu");
	assert.equal(STORY.ending[2].speaker, "Jubileu");
	assert.equal(STORY.ending[3].speaker, "Mago do Tempo");
});
