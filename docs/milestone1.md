# Milestone 1: Fundação, Core, Estado & Era Director

## Objetivo
Configurar a base TypeScript `strict`, instanciar o Kaplay com `global: false`, definir todos os contratos de tipos (`types/index.ts`), constantes globais (`constants.ts`), estado da run (`state.ts`), dados das 3 Eras (`eras.ts`), o sistema de sorteio temporal (`eraDirector.ts` + `eraBanner.ts`) e o fluxo básico de cenas (`boot` → `stage`), permitindo testar visualmente a mudança entre Passado, Presente e Futuro no navegador.

---

## Arquivos a Criar / Modificar

1. `tsconfig.json` *(modificar)*
2. `src/types/index.ts` *(criar)*
3. `src/core/k.ts` *(criar)*
4. `src/core/constants.ts` *(criar)*
5. `src/core/state.ts` *(criar)*
6. `src/core/assets.ts` *(criar)*
7. `src/data/eras.ts` *(criar)*
8. `src/systems/eraDirector.ts` *(criar)*
9. `src/ui/eraBanner.ts` *(criar)*
10. `src/scenes/boot.ts` *(criar)*
11. `src/scenes/stage.ts` *(criar)*
12. `src/main.ts` *(modificar)*

---

## Tasks Detalhadas

### Task 1.1: Habilitar `strict: true` no TypeScript
- **Arquivo:** `tsconfig.json`
- Adicionar `"strict": true` em `compilerOptions` conforme exigido pelo `CLAUDE.md`.

### Task 1.2: Definir os Tipos Centrais
- **Arquivo:** `src/types/index.ts`
- Criar e exportar:
  - `Era = "past" | "present" | "future"`
  - `WeaponId = "w1" | "w2" | "w3"`
  - `BossPattern = "chargeMelee" | "projectileBarrage" | "teleportLaser"`
  - `EraConfig` (`id`, `label`, `subtitle`, `tint`, `platformColor`, `accentColor`, `weapon`, `enemyPool`, `bossId`)
  - `WeaponDef` (`id`, `name`, `key`, `era`, `damage`, `cooldown`, `kind`, `piercing`, `range`, `projectileSpeed`, `color`)
  - `EnemyDef` (`id`, `name`, `era`, `hp`, `speed`, `contactDamage`, `behavior`, `width`, `height`, `color`)
  - `BossDef` (`id`, `name`, `era`, `hp`, `speed`, `contactDamage`, `pattern`, `attackCooldown`, `width`, `height`, `color`)
  - `CheckpointDef` (`id: number`, `tx: number`, `ty: number`)
  - `EnemySpawnDef` (`tx: number`, `ty: number`, `poolIndex: 0 | 1`, `checkpointGroup: number`)
  - `StageDef` (`tileWidth: number`, `tileHeight: number`, `map: string[]`, `checkpoints: CheckpointDef[]`, `spawns: EnemySpawnDef[]`, `bossSpawn: { tx: number; ty: number; triggerTx: number }`)
  - `DialogueLine` (`speaker: string`, `text: string`)

### Task 1.3: Instância do Kaplay e Constantes Globais
- **Arquivo:** `src/core/k.ts`
  - Inicializar `kaplay({ width: 960, height: 540, letterbox: true, background: [10, 10, 16], global: false })`.
- **Arquivo:** `src/core/constants.ts`
  - Resolução (`SCREEN_WIDTH = 960`, `SCREEN_HEIGHT = 540`)
  - Física (`GRAVITY = 1400`, `PLAYER_SPEED = 260`, `JUMP_FORCE = 560`, `FALL_DEATH_Y = 900`)
  - Dash (`DASH_SPEED = 680`, `DASH_DURATION = 0.16`, `DASH_COOLDOWN = 0.65`)
  - Combate e Era (`WRONG_ERA_MULT = 0.25`, `PLAYER_MAX_HP = 5`, `PLAYER_INVULN_TIME = 0.8`)
  - Especial e Lobisomem (`SPECIAL_MAX = 100`, `SPECIAL_GAIN_HIT = 12`, `SPECIAL_GAIN_KILL = 25`, `TRANSFORM_DURATION = 7`, `WEREWOLF_SPEED_MULT = 1.35`, `WEREWOLF_JUMP_MULT = 1.18`, `WEREWOLF_DAMAGE = 35`, `WEREWOLF_COOLDOWN = 0.25`, `WEREWOLF_RANGE = 64`)
  - Mapa de teclas `KEYS`:
    - `LEFT: "a"`, `RIGHT: "d"`, `JUMP: "space"`, `ATTACK: "h"`, `DASH: "j"`, `TRANSFORM: "q"`, `WEAPON_1: "1"`, `WEAPON_2: "2"`, `WEAPON_3: "3"`

### Task 1.4: Estado Global da Run
- **Arquivo:** `src/core/state.ts`
- Criar objeto `state` (`currentEra`, `activeWeapon`, `checkpointId`, `hp`, `maxHp`, `special`, `transformed`, `bossActive`, `bossDefeated`, `deaths`, `eraHistory`).
- Exportar `resetRun()` (zera tudo para início de jogo) e `prepareCheckpointRespawn(nextEra: Era)` (mantém `checkpointId` e `special`, restaura `hp = maxHp`, desativa `transformed` e `bossActive`, atualiza `currentEra = nextEra`).

### Task 1.5: Tabela de Eras e Era Director
- **Arquivo:** `src/data/eras.ts`
  - Definir `ERAS: Record<Era, EraConfig>` com identidades visuais contrastantes para leitura em < 1 segundo:
    - `past` ("PASSADO"): tons sépia/âmbar escuro, arma eficaz `w1`, `enemyPool: ["past_grunt", "past_brute"]`, `bossId: "boss_past"`
    - `present` ("PRESENTE"): tons urbano/azul-aço, arma eficaz `w2`, `enemyPool: ["present_shooter", "present_drone"]`, `bossId: "boss_present"`
    - `future` ("FUTURO"): tons neon ciano/magenta escuro, arma eficaz `w3`, `enemyPool: ["future_stalker", "future_turret"]`, `bossId: "boss_future"`
- **Arquivo:** `src/systems/eraDirector.ts`
  - Implementar **shuffle bag** de `["past", "present", "future"]`.
  - `pickEra(): Era`: consome a próxima Era da bag (reembaralhando quando vazia), salva em `state.currentEra` e `state.eraHistory`.
  - `pickDifferentEra(currentEra: Era): Era`: garante que a Era sorteada no respawn do checkpoint seja **estritamente diferente** de `currentEra`.
  - `applyEra(era: Era)`: desenha o background fixo com a cor `tint` da Era, dispara o `showEraBanner(era)` e emite `"era:changed"`.
- **Arquivo:** `src/ui/eraBanner.ts`
  - Exibe um banner centralizado de alto impacto no topo da tela (`"TEMPO: PASSADO"`, etc. + dica da tecla da arma correspondente `[1]`, `[2]` ou `[3]`) que desaparece suavemente após ~1.8s.

### Task 1.6: Boot, Assets e Cena Stage Inicial
- **Arquivo:** `src/core/assets.ts`
  - Função `loadAssets()` preparada para registrar sprites/sons (mantendo `k.loadRoot("./")`).
- **Arquivo:** `src/scenes/boot.ts`
  - Chama `loadAssets()`, inicializa a run (`resetRun()`, `pickEra()`) e vai para `stage` (no Milestone 6 passará por `intro` antes).
- **Arquivo:** `src/scenes/stage.ts`
  - Chama `applyEra(state.currentEra)`.
  - Atalho temporário de debug (`R`) para simular morte no checkpoint (`prepareCheckpointRespawn(pickDifferentEra(state.currentEra))` + `k.go("stage")`) e validar que o tempo sempre muda e aplica a skin/banner.
- **Arquivo:** `src/main.ts`
  - Registra cenas `boot` e `stage` e inicia com `k.go("boot")`.

---

## Como Testar no Navegador
1. Rodar `npm run dev` e abrir no navegador.
2. Verificar que a tela abre em 960x540 (letterbox), mostra a cor de fundo da Era sorteada e o banner grande com o nome da Era (`PASSADO`, `PRESENTE` ou `FUTURO`).
3. Pressionar `R` várias vezes seguidas: a cada pressão, a cena recarrega obrigatoriamente em uma Era **diferente** da anterior, mudando imediatamente a paleta de fundo e o banner.

---

## Definition of Done (DoD)
- [ ] `npx tsc --noEmit` executa sem nenhum erro com `strict: true`
- [ ] `npm run dev` abre a cena `stage` sem warnings/erros no console
- [ ] `pickDifferentEra` nunca repete a mesma Era consecutivamente ao testar o respawn
- [ ] Nenhum uso de funções globais do Kaplay (tudo via `import { k } from "../core/k"`)
