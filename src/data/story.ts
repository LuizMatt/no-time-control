import type { DialogueLine } from "../types";

export const STORY: Record<"intro" | "ending", DialogueLine[]> = {
	intro: [
		{
			speaker: "Jubileu",
			text: "Sendo bem sincero, eu sequer sei se você é real.",
		},
		{
			speaker: "Mago do Tempo",
			text: "Vejo que os medicamentos não vêm fazendo o efeito esperado em você.",
		},
		{
			speaker: "Jubileu",
			text: "Eles deveriam me manter no presente e nem isso conseguem.",
		},
		{
			speaker: "Mago do Tempo",
			text: "Você está se apegando a detalhes menores. Quem está no controle, você ou o tempo?",
		},
	],
	ending: [
    {
        speaker: "Mago do Tempo",
        text: "Você voltou. O relógio parou de saltar.",
    },
    {
        speaker: "Jubileu",
        text: "Por quanto tempo?",
    },
    {
        speaker: "Mago do Tempo",
        text: "Isso depende.",
    },
    {
        speaker: "Jubileu",
        text: "De quê?",
    },
    {
        speaker: "Mago do Tempo",
        text: "De você tomar os comprimidos.",
    },
    {
        speaker: "Jubileu",
        text: "Ah. Claro.",
    },
]
};
