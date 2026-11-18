# Milestone 6: Narrativa (`intro`, `ending`), Diálogos & Polimento de Jam

## Objetivo
Fechar o arco completo da experiência de Game Jam: implementar o sistema de diálogo typewriter (`ui/dialogue.ts`), os textos da história em `data/story.ts`, a cena de abertura com o psicólogo (`scenes/intro.ts`), a cena de encerramento/vitória após derrotar o Boss (`scenes/ending.ts`), e o polimento de feedback visual (screenshake leve, flash de impacto, tela de controles inicial).

---

## Arquivos a Criar / Modificar

1. `src/data/story.ts` *(criar)*
2. `src/ui/dialogue.ts` *(criar)*
3. `src/scenes/intro.ts` *(criar)*
4. `src/scenes/ending.ts` *(criar)*
5. `src/scenes/boot.ts` *(modificar — enviar para `"intro"` em vez de direto para `"stage"`)*
6. `src/scenes/stage.ts` *(modificar — conectar vitória do Boss para `k.go("ending")` e adicionar `k.shake()` nos impactos)*
7. `src/main.ts` *(modificar — registrar cenas `intro` e `ending`)*

---

## Tasks Detalhadas

### Task 6.1: Textos da História (`data/story.ts`)
- **Arquivo:** `src/data/story.ts`
- Definir os diálogos em PT-BR (`STORY`):
  - **`intro: DialogueLine[]`:**
    - Psicólogo: *"Respire fundo. Você disse que os apagões estão ficando mais frequentes..."*
    - Player: *"Não são só apagões. Cada vez que eu fecho os olhos, o mundo ao meu redor muda de época. Passado, presente, futuro..."*
    - Psicólogo: *"E a fera dentro de você? Quando ela desperta?"*
    - Player: *"Quando eu paro de tentar jogar pelas regras do tempo."*
    - Psicólogo: *"Então me responda uma coisa antes de começarmos..."*
    - Psicólogo: ***"Quem está no controle: você ou o tempo?"***
  - **`ending: DialogueLine[]`:**
    - Psicólogo: *"Você voltou. O relógio parou de saltar."*
    - Player: *"O tempo tentou me prender no passado pela culpa, no presente pela pressa e no futuro pelo medo."*
    - Player: *"Mas quando aceitei o que eu sou, nenhuma época pôde me parar."*
    - Psicólogo: *"Então acho que já temos a sua resposta."*

### Task 6.2: Caixa de Diálogo com Typewriter (`ui/dialogue.ts`)
- **Arquivo:** `src/ui/dialogue.ts`
- Criar `startDialogue(lines: DialogueLine[], onComplete: () => void)`:
  - Renderiza caixa de diálogo estilizada na parte inferior da tela com nome do `speaker` em destaque e texto sendo revelado letra por letra (`typewriter`).
  - Pressionar `Espaço` ou `Enter`:
    - Se a frase atual ainda está digitando: revela a frase inteira imediatamente.
    - Se a frase já terminou: avança para a próxima linha (ou chama `onComplete()` ao terminar todas).
  - Opção `Tab` / `Esc` para pular a cutscene rapidamente (útil para quem está rejogando na jam).

### Task 6.3: Cenas `intro` e `ending` (`scenes/intro.ts`, `scenes/ending.ts`)
- **Arquivo:** `src/scenes/intro.ts`
  - Composição visual minimalista de consultório (silhuetas/placeholders do psicólogo e do protagonista + relógio/pêndulo no fundo).
  - Roda `startDialogue(STORY.intro, () => { resetRun(); pickEra(); k.go("stage"); })`.
- **Arquivo:** `src/scenes/ending.ts`
  - Roda `startDialogue(STORY.ending, ...)` e, ao finalizar, exibe o resumo da run:
    - Título final e mensagem de vitória;
    - Quantas trocas de tempo/mortes ocorreram (`state.deaths`) e o histórico de Eras enfrentadas (`state.eraHistory`);
    - Prompt `"Pressione [ESPAÇO] para jogar novamente"` (que chama `resetRun()` e volta para `intro` ou `stage`).

### Task 6.4: Feedback de Combate (Juice) e Revisão Final de Build
- **Arquivo:** `src/scenes/stage.ts` / `src/systems/weaponSystem.ts`
  - Adicionar `k.shake(3)` ao acertar golpes efetivos, `k.shake(8)` ao transformar em Lobisomem (`Q`) ou tomar dano, e `k.shake(12)` ao derrotar o Boss.
  - Exibir dica discreta dos controles no início do Checkpoint 0 (`[A/D] Mover  [Espaço] Pular  [J] Dash  [H] Atacar  [1/2/3] Arma da Era  [Q] Lobisomem`).
- Validar `npm run check` (`tsc --noEmit`) e `npm run build` (`vite build`) para garantir que o pacote estático para itch.io gera sem erros.

---

## Como Testar no Navegador (Fluxo Ponta a Ponta)
1. Rodar `npm run dev`.
2. Assistir e avançar pelo diálogo do psicólogo na cena `intro` com `Espaço`.
3. Cair na cena `stage` com a Era sorteada, ler a Era em < 1s pelo banner/paleta, trocar para a arma correspondente (`1/2/3`), avançar pelos checkpoints usando pulo (`Espaço`), dash (`J`), ataque (`H`) e transformação em Lobisomem (`Q`).
4. Morrer pelo menos uma vez para validar o respawn no checkpoint em outra Era.
5. Chegar na arena final, derrotar o Boss da Era ativa e assistir à cena `ending` com as estatísticas da run e opção de jogar novamente.
6. Rodar `npm run check` e `npm run build`.

---

## Definition of Done (DoD)
- [ ] Fluxo completo `boot → intro → stage (checkpoints + boss) → ending → replay` funcionando sem erros
- [ ] `npx tsc --noEmit` e `npm run build` 100% limpos
- [ ] Todos os itens do MVP do `ARCHITECTURE.md` concluídos
