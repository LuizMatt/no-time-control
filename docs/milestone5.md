# Milestone 5: Boss Final com 3 Variantes de Era (`bosses.ts` + `boss.ts`)

## Objetivo
Implementar o confronto climático no final do estágio: o **Boss adaptativo por Era**, que muda seu padrão de ataque, visual e vulnerabilidade de acordo com o tempo ativo (`past` = investida corpo a corpo, `present` = rajada de projéteis, `future` = teleporte + feixe de laser), integrado com o Checkpoint 3 (porta da arena) para que morrer no Boss faça o player renascer na entrada da arena enfrentando uma **variante temporal diferente do Boss**.

---

## Arquivos a Criar / Modificar

1. `src/data/bosses.ts` *(criar)*
2. `src/entities/boss.ts` *(criar)*
3. `src/ui/hud.ts` *(modificar — conectar barra de HP do Boss)*
4. `src/scenes/stage.ts` *(modificar — gatilho de entrada na arena, bloqueio de saída e vitória ao derrotar o Boss)*

---

## Tasks Detalhadas

### Task 5.1: Tabela das 3 Variantes do Boss (`data/bosses.ts`)
- **Arquivo:** `src/data/bosses.ts`
- Definir `BOSSES: Record<string, BossDef>`:
  1. **`boss_past` (Era: `"past"`, Nome: `"Carcereiro Primordial"`):**
     - `pattern: "chargeMelee"`, `hp: 320`, `speed: 220`, `contactDamage: 1`, `attackCooldown: 2.0`, `width: 56`, `height: 68`.
     - Vulnerável à arma `1` (Passado - Lâmina Ancestral) e às garras do Lobisomem (`Q`).
  2. **`boss_present` (Era: `"present"`, Nome: `"Executor Balístico"`):**
     - `pattern: "projectileBarrage"`, `hp: 280`, `speed: 170`, `contactDamage: 1`, `attackCooldown: 1.8`, `width: 48`, `height: 64`.
     - Vulnerável à arma `2` (Presente - Pistola Tática) e às garras do Lobisomem (`Q`).
  3. **`boss_future` (Era: `"future"`, Nome: `"Arconte Crono-Sintético"`):**
     - `pattern: "teleportLaser"`, `hp: 300`, `speed: 190`, `contactDamage: 1`, `attackCooldown: 2.2`, `width: 50`, `height: 66`.
     - Vulnerável à arma `3` (Futuro - Canhão de Plasma) e às garras do Lobisomem (`Q`).

### Task 5.2: Entidade do Boss e Máquina de Padrões por Era (`entities/boss.ts`)
- **Arquivo:** `src/entities/boss.ts`
- Criar `makeBoss(def: BossDef, spawnPos: Vec2, arenaBounds: { leftX: number; rightX: number; floorY: number })`:
  - Tags `"boss"`, `"combatTarget"`, propriedade `era: def.era`, `hp: def.hp`, `maxHp: def.hp`.
  - Implementa os 3 padrões de ataque com **telegrafia clara** (telegraph de `0.45s` piscando/avisando antes do golpe, para o player reagir com Pulo ou Dash `J`):
    - **Padrão 1 (`chargeMelee` — Passado):**
      - Caminha em direção ao player; a cada `attackCooldown`, faz um *wind-up* (pisca amarelo/laranja) e dispara em uma **investida veloz (`charge`)** horizontal de um lado ao outro da arena, seguida de um salto pesado que força o player a pular ou dar dash (`J`).
    - **Padrão 2 (`projectileBarrage` — Presente):**
      - Reposiciona-se mantendo distância média e alterna entre uma **rajada de 3 tiros horizontais** em alturas diferentes (exigindo pular ou agachar/dash) e um **disparo em leque** na direção do player.
    - **Padrão 3 (`teleportLaser` — Futuro):**
      - Teleporta-se entre as extremidades/plataformas da arena (com efeito visual de desaparecimento), carrega por `0.5s` exibindo uma linha de mira fina e dispara um **feixe/projétil de alta velocidade** atravessando a arena.
  - Emite `"boss:updated"` (com `{ hp, maxHp, name, era }`) sempre que sofre dano.
  - Quando `hp <= 0`:
    - Define `state.bossDefeated = true`, `state.bossActive = false`.
    - Emite `"boss:defeated"`.
    - Executa pequeno efeito visual de derrota e após `1.5s` avança para a cena final (`k.go("ending")` ou transição).

### Task 5.3: Gatilho da Arena e Barra de Vida do Boss (`scenes/stage.ts`, `ui/hud.ts`)
- **Arquivo:** `src/scenes/stage.ts`
  - Quando `player.pos.x` ultrapassa `STAGE_1.bossSpawn.triggerTx * tileWidth` e `!state.bossActive && !state.bossDefeated`:
    - Define `state.bossActive = true`.
    - Fecha o portão de entrada da arena (cria parede estática atrás do player para impedir fuga da arena).
    - Busca `const bossDef = BOSSES[ERAS[state.currentEra].bossId]` e instancia `makeBoss(...)`.
- **Arquivo:** `src/ui/hud.ts`
  - Quando `state.bossActive === true`, exibe na parte inferior da tela o nome da variante atual do Boss (ex.: `"CARCEREIRO PRIMORDIAL [PASSADO]"`) e sua barra de HP sincronizada.

---

## Como Testar no Navegador
1. Rodar `npm run dev` e avançar até o final da fase (passando pelo Checkpoint 3 na porta da arena).
2. Entrar na arena: verificar que o portão fecha, a barra de vida do Boss aparece no HUD e o Boss corresponde à Era atual.
3. Testar o combate contra o Boss:
   - Usar a arma da Era certa (`1`, `2` ou `3`) ou transformar em Lobisomem (`Q`) para causar 100% de dano.
   - Usar o Dash (`J`) e o Pulo (`Espaço`) para desviar dos ataques telegrafados.
4. **Teste de Morte no Boss:** deixar o Boss derrotar o player → confirmar que o player renasce no **Checkpoint 3 (porta da arena)** em uma **Era diferente**, e ao entrar na arena enfrenta **outra variante do Boss**!
5. Derrotar o Boss e verificar que o evento de vitória é disparado.

---

## Definition of Done (DoD)
- [ ] `npx tsc --noEmit` limpo
- [ ] As 3 variantes do Boss (`chargeMelee`, `projectileBarrage`, `teleportLaser`) funcionam de forma distinta e justa (com telegrafia para esquiva via Dash `J` / Pulo)
- [ ] Morrer no Boss renasce no Checkpoint 3 com uma Era diferente e troca a variante do Boss
- [ ] Barra de HP do Boss no HUD atualiza corretamente e some ao derrotá-lo
