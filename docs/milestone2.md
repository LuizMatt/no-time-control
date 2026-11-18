# Milestone 2: Player (`A/D`, `Espaço`, Dash `J`), Estágio, Checkpoints & Respawn Temporal

## Objetivo
Construir o estágio jogável completo em tilemap (`data/stages.ts`), a entidade do Player com física fluida (movimento `A/D`, pulo `Espaço`, dash `J` com cooldown e invulnerabilidade curta), câmera seguindo o jogador, checkpoints ativáveis ao longo da fase e o ciclo real de **Morte → Respawn no último Checkpoint em uma Era diferente**.

---

## Arquivos a Criar / Modificar

1. `src/data/stages.ts` *(criar)*
2. `src/entities/player.ts` *(criar)*
3. `src/entities/checkpoint.ts` *(criar)*
4. `src/scenes/stage.ts` *(modificar)*

---

## Tasks Detalhadas

### Task 2.1: Layout do Estágio Único + Pontos de Checkpoint e Arena do Boss
- **Arquivo:** `src/data/stages.ts`
- Definir `STAGE_1: StageDef` contendo:
  - `tileWidth: 32`, `tileHeight: 32`.
  - `map: string[]`: um nível side-scroller horizontal longo (~120–150 colunas por 18 linhas) dividido em:
    - **Seção 0 (Início):** plataformas iniciais e fosso simples para ensinar pulo e dash (`J`).
    - **Checkpoint 1:** ponto seguro após a Seção 0.
    - **Seção 1 (Intermediária):** plataformas em diferentes alturas e vãos maiores.
    - **Checkpoint 2:** ponto seguro no meio da fase.
    - **Seção 2 (Pré-Boss):** corredor com obstáculos e plataformas elevadas.
    - **Checkpoint 3 (Porta do Boss):** logo antes de entrar na arena final (para que morrer no Boss renasça direto na porta da arena em outra Era!).
    - **Arena do Boss:** sala ampla e plana com plataformas laterais e paredes de contenção.
  - `checkpoints`: coordenadas `(tx, ty)` dos Checkpoints `0` (spawn inicial), `1`, `2` e `3`.
  - `spawns`: lista de coordenadas já preparadas para os inimigos do Milestone 3.
  - `bossSpawn`: posição do Boss e coluna `triggerTx` que inicia a luta no Milestone 5.

### Task 2.2: Entidade de Checkpoint
- **Arquivo:** `src/entities/checkpoint.ts`
- Criar `makeCheckpoint(def: CheckpointDef)`:
  - Renderiza um totem/marcador vertical usando `k.rect()` cuja cor reflete se já está ativo (`state.checkpointId >= def.id`) ou inativo.
  - Ao colidir com `"player"`:
    - Se `state.checkpointId < def.id`, atualiza `state.checkpointId = def.id`, restaura `state.hp = state.maxHp`, muda a cor do totem para ativo e mostra um texto flutuante `"CHECKPOINT SALVO"` que sobe e desaparece.

### Task 2.3: Entidade do Player (Movimento, Pulo, Dash e Dano/Morte)
- **Arquivo:** `src/entities/player.ts`
- Criar `makePlayer(spawnPos: Vec2)`:
  - Componentes Kaplay: `k.rect(28, 44)`, `k.pos(spawnPos)`, `k.area()`, `k.body()`, `k.anchor("bot")`, tag `"player"`.
  - Estado interno da entidade:
    - `facing: 1 | -1` (`1` = direita, `-1` = esquerda, com indicador visual de direção).
    - `isDashing: boolean`, `dashTimer: number`, `dashCooldownTimer: number`.
    - `invulnTimer: number` (i-frames ao tomar dano ou durante o dash).
  - **Movimentação (`A` / `D`):**
    - Move com `PLAYER_SPEED` (ou multiplicado por `WEREWOLF_SPEED_MULT` se `state.transformed`).
    - Atualiza `facing = -1` (`A`) ou `1` (`D`).
  - **Pulo (`Espaço`):**
    - Se `player.isGrounded()` e não estiver em dash, aplica `player.jump(JUMP_FORCE)`.
  - **Dash (`J`):**
    - Se `dashCooldownTimer <= 0` e `!isDashing`:
      - Ativa `isDashing = true`, `dashTimer = DASH_DURATION`, `dashCooldownTimer = DASH_COOLDOWN`, `invulnTimer = DASH_DURATION`.
      - Enquanto `isDashing`: zera a velocidade vertical (`vel.y = 0`), aplica deslocamento horizontal `facing * DASH_SPEED` e cria pequenos rastros visuais (afterimages com `k.rect` e `k.opacity`).
  - **Dano e Morte (`takeDamage(amount: number)`):**
    - Ignora se `invulnTimer > 0` ou `isDashing`.
    - Reduz `state.hp`, aplica `invulnTimer = PLAYER_INVULN_TIME`, faz flash visual no player e emite `"player:hurt"`.
    - Se `state.hp <= 0` ou se `player.pos.y > FALL_DEATH_Y`: chama `triggerPlayerDeath()`.
  - **Função `triggerPlayerDeath()`:**
    - Sorteia nova Era com `const nextEra = pickDifferentEra(state.currentEra)`.
    - Chama `prepareCheckpointRespawn(nextEra)`.
    - Recarrega `k.go("stage")`.

### Task 2.4: Montagem do Nível e Câmera na Cena `stage`
- **Arquivo:** `src/scenes/stage.ts`
- Configurar gravidade `k.setGravity(GRAVITY)`.
- Construir os tiles estáticos a partir de `STAGE_1.map` pintados com `ERAS[state.currentEra].platformColor`.
- Instanciar os checkpoints (`makeCheckpoint`).
- Buscar as coordenadas do checkpoint atual (`state.checkpointId`) e instanciar o player ali.
- No `onUpdate` da cena: atualizar `k.camPos()` suavemente acompanhando o `player.pos.x` (limitado às bordas do mapa) e altura fixa/suave.

---

## Como Testar no Navegador
1. Rodar `npm run dev`.
2. Mover com `A` e `D`, pular plataformas com `Espaço` e usar o Dash com `J` para atravessar fossos largos.
3. Passar pelo Checkpoint 1 e ver o indicador mudar de cor + texto `"CHECKPOINT SALVO"`.
4. Pular em um buraco (ou apertar `R`): confirmar que o player **renasce na posição do Checkpoint 1** (e não no início da fase) e que **a Era do estágio mudou automaticamente** (fundo, cor das plataformas e banner da nova Era).

---

## Definition of Done (DoD)
- [ ] `npx tsc --noEmit` limpo
- [ ] Movimento (`A/D`), Pulo (`Espaço`) e Dash (`J`) responsivos e com colisão sólida nas plataformas
- [ ] Checkpoints `1`, `2` e `3` salvam o progresso corretamente em `state.checkpointId`
- [ ] Cair em um buraco ou morrer faz respawn no último checkpoint em uma Era diferente
