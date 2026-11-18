# CLAUDE.md

Instruções para o agente ao trabalhar neste repositório.

## Projeto

Game de game jam (prazo curto, **48h**, 1 dev + IA). Platformer 2D side-scroller em **TypeScript + Kaplay + Vite**.

Conceito: o player é um lobisomem. O jogo possui **1 estágio completo com checkpoints e um Boss no final**, com **3 variantes temporais** (Passado, Presente, Futuro).
- O tempo inicial é sorteado ao entrar no estágio.
- Quando o player morre, ele renasce no **último checkpoint alcançado**, mas o tempo **muda obrigatoriamente para uma variante diferente** da que ele estava quando morreu.
- Tanto os inimigos (mobs) quanto o Boss final mudam de comportamento, aparência e vulnerabilidade de acordo com o tempo atual.
- Existem 3 armas (teclas `1/2/3`), cada uma eficaz contra os inimigos/Boss de um tempo (`1` = Passado melee, `2` = Presente tiro reto, `3` = Futuro tiro perfurante). Atacar com a arma da era errada causa apenas 25% de dano (`WRONG_ERA_MULT = 0.25`).
- Controles: `A/D` move, `Espaço` pula, `H` ataca, `J` dash, `Q` transforma em lobisomem (barra de especial cheia, causando 100% de dano em qualquer tempo), `1/2/3` troca de arma.
- O jogo abre com uma cutscene de um psicólogo perguntando *"Quem está no controle, você ou o tempo?"* e encerra na cena `ending` após derrotar o Boss.

**Leia `ARCHITECTURE.md` e os planos em `docs/milestone1.md` a `docs/milestone6.md` antes de implementar qualquer coisa.** Eles são a fonte da verdade sobre estrutura, fluxo de cenas, modelo de dados e escopo.

## Prioridades (nesta ordem)

1. **Funcionar e ser jogável** > código bonito. É uma jam.
2. **Escopo pequeno.** Siga estritamente as tasks dos milestones em `docs/milestone*.md`. Se algo estiver fora do escopo, pergunte antes de fazer.
3. **Mudanças pequenas e rodáveis.** Entregue em passos que o dev consiga testar no navegador a cada etapa.
4. **Placeholders antes de arte.** Use `k.rect()`/cores por era até o loop de gameplay estar bom.

## Convenções de código

- TypeScript `strict: true`. Sem `any`; se for inevitável, comente o motivo.
- Identificadores, nomes de arquivo e comentários em **inglês**. Textos exibidos ao jogador (falas, UI) em **português (PT-BR)**.
- Arquivos em `camelCase.ts`; tipos/interfaces em `PascalCase`; constantes em `UPPER_SNAKE_CASE`.
- Prefira **funções e objetos simples** a classes. Entidades são game objects do Kaplay montados por factories.
- Sem números mágicos: valores de balanceamento ficam em `src/core/constants.ts` ou `src/data/*`.
- Sem dependências novas sem avisar. Manter o bundle pequeno.

## Regras de arquitetura

- Instância única do Kaplay em `src/core/k.ts` (`global: false`). Sempre `import { k } from "../core/k"`; **não** usar funções globais do Kaplay.
- **Conteúdo é dado.** Armas, inimigos, bosses, eras, estágio e falas vivem em `src/data/`. Para adicionar ou ajustar um inimigo/arma/boss, edite a tabela, não a lógica.
- `data/` não importa de `scenes/`, `systems/` ou `entities/`.
- Estado da run em `src/core/state.ts` (objeto simples + `resetRun()` + `prepareCheckpointRespawn()`). Não esconder estado em variáveis de módulo.
- Comunicação entre sistemas por **eventos do Kaplay** (`k.trigger` / `k.on`) ou leitura de `state`, evitando acoplamento direto (ex.: `"transform:start"`).
- Cenas só orquestram; lógica reutilizável vai em `systems/` e `entities/`.
- Um estágio = um layout com checkpoints e arena de Boss. As 3 eras mudam **skin, inimigos, variante do Boss e música**, não o código da fase.

## Regras de design a respeitar

- O tempo da fase deve ser **identificável em menos de 1 segundo** (paleta, banner, música, ícone no HUD). Nunca remova esses sinais sem substituir.
- Sorteio inicial do tempo via **shuffle bag** em `eraDirector`, e na morte via `pickDifferentEra(state.currentEra)` para garantir que o respawn no checkpoint nunca repita imediatamente o tempo em que o jogador morreu.
- Dano usa o multiplicador `WRONG_ERA_MULT` (`0.25`) quando a arma não é a do tempo do alvo (inimigo ou Boss); transformado em lobisomem, o multiplicador é sempre `1.0`.
- Controles padrão definidos em `constants.ts`: `A/D` (mover), `space` (pular), `h` (atacar), `j` (dash), `q` (transformar), `1/2/3` (armas).

## Como trabalhar comigo

- Se faltar alguma decisão durante a implementação, **pergunte uma coisa de cada vez** em vez de assumir silenciosamente. Se assumir algo menor, deixe a suposição explícita no resumo.
- Antes de mudanças grandes, descreva o plano em poucas linhas.
- Depois de editar, rode `npx tsc --noEmit` e informe se há erros.
- Ao criar um arquivo novo, siga a estrutura de pastas do `ARCHITECTURE.md`. Se precisar fugir dela, explique por quê.
- Não refatore código que não faz parte da tarefa. Anote ideias de melhoria em vez de aplicá-las.
- Não gere nem baixe assets protegidos por copyright. Use placeholders ou peça os arquivos ao dev.

## Armadilhas conhecidas (Kaplay)

- Registre assets (`loadSprite`, `loadSound`) em `core/assets.ts` e só use depois do `boot`.
- Gravidade/colisão: use `body()` + `area()` no player, inimigos e Boss; plataformas com `body({ isStatic: true })`.
- Objetos criados dentro de uma cena são destruídos ao trocar de cena; estado persistente (`checkpointId`, `currentEra`, `special`, etc.) deve ir para `state.ts`.
- Em HMR do Vite, a cena pode reiniciar; não dependa de estado só em memória de cena.

## Definition of Done (por tarefa / milestone)

- [ ] Roda no `npm run dev` sem erros no console
- [ ] `npx tsc --noEmit` limpo
- [ ] Valores de balanceamento em `data/` ou `constants.ts`
- [ ] Funciona nas 3 eras (quando aplicável)
- [ ] Nenhum item fora do escopo do milestone foi adicionado sem alinhamento
