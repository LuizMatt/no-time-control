# Milestone 3: Sistema de Armas (`1/2/3`, `H`), Projéteis & Inimigos por Era

## Objetivo
Implementar o loop central de combate: as **3 armas** (`1` = melee do Passado, `2` = tiro reto do Presente, `3` = tiro perfurante do Futuro), disparo/ataque na tecla `H`, cálculo de dano por Era (`1.0x` na Era certa, `WRONG_ERA_MULT = 0.25x` na Era errada com feedback visual), projéteis e os **6 tipos de inimigos** (2 por Era) instanciados pelo `spawner.ts` de acordo com o tempo ativo.

---

## Arquivos a Criar / Modificar

1. `src/data/weapons.ts` *(criar)*
2. `src/data/enemies.ts` *(criar)*
3. `src/entities/projectile.ts` *(criar)*
4. `src/systems/weaponSystem.ts` *(criar)*
5. `src/entities/enemy.ts` *(criar)*
6. `src/systems/spawner.ts` *(criar)*
7. `src/entities/player.ts` *(modificar — integrar troca de arma e tecla `H`)*
8. `src/scenes/stage.ts` *(modificar — chamar `spawnStageEnemies`)*

---

## Tasks Detalhadas

### Task 3.1: Tabela das 3 Armas (`data/weapons.ts`)
- **Arquivo:** `src/data/weapons.ts`
- Definir `WEAPONS: Record<WeaponId, WeaponDef>`:
  - `w1` (Tecla `1`, Era `"past"`, Nome `"Lâmina Ancestral"`):
    - `kind: "melee"`, `damage: 25`, `cooldown: 0.32`, `range: 52`, `piercing: true` (golpe em área curta à frente).
  - `w2` (Tecla `2`, Era `"present"`, Nome `"Pistola Tática"`):
    - `kind: "projectile"`, `damage: 18`, `cooldown: 0.28`, `range: 420`, `projectileSpeed: 620`, `piercing: false` (destrói no 1º impacto).
  - `w3` (Tecla `3`, Era `"future"`, Nome `"Canhão de Plasma"`):
    - `kind: "projectile"`, `damage: 22`, `cooldown: 0.45`, `range: 520`, `projectileSpeed: 760`, `piercing: true` (atravessa múltiplos inimigos na linha).

### Task 3.2: Entidade de Projétil (`entities/projectile.ts`)
- **Arquivo:** `src/entities/projectile.ts`
- Criar `spawnPlayerProjectile(opts)` e `spawnEnemyProjectile(opts)`:
  - Projétil do player carrega `weaponEra: Era`, `baseDamage: number`, `piercing: boolean` e um `Set<number>` de IDs de inimigos já atingidos (para que projéteis `piercing: true` acertem cada inimigo na linha apenas uma vez sem dar dano a cada frame).
  - Destrói ao atingir a distância máxima (`range`), ao bater em parede (`"platform"`) ou, se `!piercing`, no primeiro inimigo/Boss atingido.
  - Projétil de inimigo/Boss (`tag: "enemyProjectile"`) causa dano ao colidir com `"player"`.

### Task 3.3: Weapon System e Regra de Dano por Era (`systems/weaponSystem.ts`)
- **Arquivo:** `src/systems/weaponSystem.ts`
- Função `computeDamage(weaponEra: Era | "universal", targetEra: Era, baseDamage: number): { damage: number; effective: boolean }`:
  - Se `state.transformed === true` ou `weaponEra === "universal"` ou `weaponEra === targetEra`: retorna `{ damage: baseDamage, effective: true }`.
  - Caso contrário: retorna `{ damage: Math.max(1, Math.round(baseDamage * WRONG_ERA_MULT)), effective: false }`.
- Função `applyHitToTarget(target, weaponEra, baseDamage)`:
  - Calcula o dano via `computeDamage`.
  - Subtrai do HP do alvo e emite evento `"combat:hit"` (que no Milestone 4 encherá a barra de especial).
  - Mostra feedback visual flutuante no alvo:
    - Se `effective === true`: número de dano amarelo/branco vibrante + flash branco no inimigo.
    - Se `effective === false`: número pequeno cinza + texto `"RESISTIU (25%)"` para deixar imediatamente claro ao jogador que está com a arma da Era errada.
- Função `setupWeaponControls(player)`:
  - Teclas `1`, `2`, `3` atualizam `state.activeWeapon` e emitem `"weapon:changed"`.
  - Tecla `H` executa o ataque (criando hitbox melee temporária à frente do player para `w1`/lobisomem, ou disparando `spawnPlayerProjectile` para `w2`/`w3`).

### Task 3.4: Tabela de Inimigos por Era (`data/enemies.ts`)
- **Arquivo:** `src/data/enemies.ts`
- Definir 6 inimigos (`ENEMIES: Record<string, EnemyDef>`), 2 para cada Era:
  - **Passado (`past`):**
    1. `past_grunt`: patrulheiro rápido (`behavior: "patrol"`, `hp: 40`).
    2. `past_brute`: perseguidor pesado de curto alcance (`behavior: "chase"`, `hp: 75`).
  - **Presente (`present`):**
    1. `present_shooter`: soldado que mantém posição e atira horizontalmente (`behavior: "shoot"`, `hp: 45`).
    2. `present_drone`: drone voador em onda senoidal/horizontal (`behavior: "fly"`, `hp: 35`).
  - **Futuro (`future`):**
    1. `future_stalker`: caçador veloz que avança ao detectar o player (`behavior: "chase"`, `hp: 50`).
    2. `future_turret`: sentinela blindada que dispara projéteis rápidos (`behavior: "shoot"`, `hp: 70`).

### Task 3.5: Factory de Inimigos e Spawner por Era (`entities/enemy.ts`, `systems/spawner.ts`)
- **Arquivo:** `src/entities/enemy.ts`
  - `makeEnemy(def: EnemyDef, pos: Vec2)`:
    - Monta o objeto com `k.rect(def.width, def.height)`, cor da Era/inimigo, barra de HP pequena acima da cabeça, tags `"enemy"` e `"combatTarget"`, e propriedade `era: def.era`.
    - Executa o comportamento (`patrol`, `chase`, `fly`, `shoot`) em mapa de funções simples.
    - Colisão de contato com `"player"` chama `player.takeDamage(def.contactDamage)`.
    - Quando `hp <= 0`: emite `"combat:kill"` e `enemy.destroy()`.
- **Arquivo:** `src/systems/spawner.ts`
  - `spawnStageEnemies(stageDef, currentEra)`:
    - Lê `ERAS[currentEra].enemyPool` (`[id0, id1]`).
    - Para cada spawn em `stageDef.spawns` que esteja à frente do checkpoint atual (`spawn.checkpointGroup >= state.checkpointId`), instancia `makeEnemy(ENEMIES[pool[spawn.poolIndex]], pos)`.

---

## Como Testar no Navegador
1. Rodar `npm run dev` e observar a Era sorteada no banner.
2. Atacar um inimigo com `H` usando a **arma errada**: confirmar que o dano é reduzido (25%) e aparece o aviso visual `"RESISTIU (25%)"`.
3. Trocar para a **arma certa** (`1` no Passado, `2` no Presente, `3` no Futuro) e atacar com `H`: confirmar que o dano é total (100%) e elimina o inimigo rapidamente.
4. Testar as particularidades das 3 armas:
   - `1`: golpe melee curto à frente;
   - `2`: projétil que some no primeiro inimigo;
   - `3`: projétil de energia que **atravessa** dois inimigos alinhados causando dano em ambos.
5. Morrer (ou apertar `R`) em um checkpoint e verificar que os inimigos da seção mudam de tipo, cor e comportamento para a nova Era sorteada.

---

## Definition of Done (DoD)
- [ ] `npx tsc --noEmit` limpo
- [ ] Troca de armas em `1/2/3` e ataque em `H` funcionando com cooldown
- [ ] Multiplicador `WRONG_ERA_MULT = 0.25` aplicado e sinalizado visualmente quando a Era da arma difere da Era do inimigo
- [ ] Os 6 inimigos (2 por Era) nascem corretamente de acordo com `state.currentEra`
