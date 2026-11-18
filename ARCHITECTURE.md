# ARCHITECTURE.md

> Título provisório: **No Time Control** (definir título final). Game jam, 48h, 1 dev (com IA), TypeScript + Kaplay.

## 1. Visão geral

Platformer 2D side-scroller de ação. O player é um lobisomem em busca de respostas sobre o que está acontecendo com ele. O jogo abre com uma cutscene em que um psicólogo pergunta: **"Quem está no controle, você ou o tempo?"**

O jogo possui **1 estágio completo com checkpoints e um Boss no final**, existindo em **3 variantes temporais**: Passado, Presente e Futuro.
- A variante inicial é **sorteada ao entrar no estágio**, então o player nunca sabe de antemão em qual tempo vai cair.
- Ao **morrer**, o player retorna rapidamente ao **último checkpoint alcançado**, mas o tempo **muda obrigatoriamente para uma variante diferente** daquela em que ele morreu.
- Tanto os **mobs (inimigos)** quanto o **Boss final** variam de acordo com o tempo ativo no momento.
- Existem **3 armas** (teclas `1`, `2`, `3`), cada uma eficaz contra os inimigos e o Boss de um tempo específico (armas de outros tempos causam apenas 25% de dano).
- O player possui **movimentação lateral (`A/D`), pulo (`Espaço`), dash (`J`) e ataque (`H`)**.
- Uma **barra de especial** enche ao combater e, quando cheia, permite se transformar em **lobisomem (`Q`)** por alguns segundos — ignorando a restrição de tempo (100% de dano contra qualquer Era) e ganhando bônus de velocidade e pulo.

### Pilares (guiam qualquer decisão de escopo)

1. **Reagir ao tempo.** Ao iniciar ou renascer em um checkpoint, o player identifica o novo tempo rapidamente e troca para a arma certa (`1`, `2` ou `3`). Esse é o loop central.
2. **O tempo controla você, até a transformação.** O lobisomem (`Q`) é o momento de retomar o controle (acerta qualquer inimigo ou Boss com dano total).
3. **Barato de produzir.** Uma única estrutura de estágio com checkpoints e arena de Boss, vestindo três "skins" e tabelas de dados (`past`, `present`, `future`). Placeholders (`k.rect()`) primeiro, arte depois.

---

## 2. Stack

| Item             | Escolha                                  |
| ---------------- | ---------------------------------------- |
| Linguagem        | TypeScript (`strict: true`)              |
| Engine           | Kaplay (`global: false`)                 |
| Build/dev server | Vite                                     |
| Assets           | `public/assets/` (sprites, sons, música) |
| Deploy           | Build estático (itch.io / GitHub Pages)  |

Inicialização do Kaplay com `global: false`, para ter tipagem forte e evitar poluir o escopo global:

```ts
// src/core/k.ts
import kaplay from "kaplay";
export const k = kaplay({
  width: 960,
  height: 540,
  letterbox: true,
  background: [0, 0, 0],
  global: false,
});
```

Todos os módulos importam `k` de `core/k.ts`.

---

## 3. Estrutura de pastas

```
src/
  main.ts                 # registra cenas e chama go("boot")
  core/
    k.ts                  # instância única do Kaplay (global: false)
    constants.ts          # tamanhos, física, teclas, multiplicadores, cooldowns
    state.ts              # GameState (run atual, checkpointId, era atual)
    assets.ts             # loadSprite / loadSound centralizados
  data/                   # TUDO que é balanceamento/conteúdo fica aqui
    eras.ts               # config visual/sonora por tempo
    weapons.ts            # stats das 3 armas (melee, tiro reto, tiro perfurante)
    enemies.ts            # tabela de inimigos por tempo (2 por era)
    bosses.ts             # tabela das 3 variantes do Boss (1 por era)
    stages.ts             # layout (tilemap), checkpoints, spawns de mobs e arena do Boss
    story.ts              # falas do psicólogo (intro) e desfecho (ending)
  scenes/
    boot.ts               # carrega assets e vai para intro
    intro.ts              # cutscene inicial do psicólogo
    stage.ts              # estágio jogável (carrega no checkpoint atual + era atual)
    ending.ts             # cutscene/tela final após derrotar o Boss
  systems/
    eraDirector.ts        # sorteio do tempo (shuffle bag + troca forçada na morte) + aplica skin
    weaponSystem.ts       # troca (1/2/3), ataque (H) e cálculo de dano por era
    specialMeter.ts       # barra de especial + transformação em lobisomem (Q)
    spawner.ts            # spawn de inimigos e Boss conforme a era ativa
  entities/
    player.ts             # movimentação (A/D), pulo (Espaço), dash (J), ataque (H), dano
    enemy.ts              # factory de mobs a partir de data/enemies.ts
    boss.ts               # factory do Boss a partir de data/bosses.ts (3 padrões por era)
    checkpoint.ts         # marcador de progresso que salva checkpointId no state
    projectile.ts         # projéteis do player (normal/piercing) e de inimigos/Boss
    pickup.ts             # itens opcionais (cura/energia)
  ui/
    hud.ts                # HP, barra de especial, arma ativa (1/2/3), ícone do tempo, HP do Boss
    dialogue.ts           # caixa de texto com typewriter
    eraBanner.ts          # banner "PASSADO / PRESENTE / FUTURO" ao entrar/renascer
  types/
    index.ts              # Era, WeaponId, WeaponDef, EnemyDef, BossDef, StageDef, etc.
```

Regra de dependência: `data/` não importa nada de `scenes/`, `systems/` ou `entities/`. `scenes/` orquestra; `systems/` e `entities/` implementam; `ui/` só lê estado e escuta eventos.

---

## 4. Fluxo de cenas e Respawn Temporal

```
boot → intro (psicólogo) → stage (checkpoint 0, era sorteada) ──► (Boss derrotado) → ending
                               │
                               └── (morte / queda) → pickDifferentEra(state.currentEra)
                                                   → restaura HP e recarrega stage no último checkpoint
```

- Ao entrar no `stage` pela primeira vez (vindo da `intro`), `checkpointId = 0` e `eraDirector.pickEra()` sorteia a Era inicial.
- Ao colidir com um checkpoint na fase, `state.checkpointId` é atualizado (e o player recupera vida se aplicável).
- **Morte e Respawn no Checkpoint:** quando o HP do player chega a `0` (ou ele cai em um abismo), o jogo **não** reseta a run inteira. Ele chama `eraDirector.pickDifferentEra(state.currentEra)` (garantindo que o novo tempo seja diferente daquele em que o player acabou de morrer) e reinicia a cena `stage` posicionando o player no `checkpointId` salvo, com todos os inimigos e o Boss agora na variante do novo tempo.
- Derrotar o Boss no final do estágio leva para a cena `ending`.

---

## 5. Modelo de dados central

```ts
// src/types/index.ts
export type Era = "past" | "present" | "future";
export type WeaponId = "w1" | "w2" | "w3";

export interface EraConfig {
  id: Era;
  label: string;                  // "PASSADO" | "PRESENTE" | "FUTURO"
  tint: [number, number, number]; // cor de fundo/ambiente da era
  platformColor: [number, number, number];
  bgSprite?: string;
  music?: string;
  weapon: WeaponId;               // arma eficaz neste tempo
  enemyPool: string[];            // ids em data/enemies.ts
  bossId: string;                 // id em data/bosses.ts
}

export interface WeaponDef {
  id: WeaponId;
  name: string;
  key: "1" | "2" | "3";
  era: Era;                       // contra qual tempo é eficaz (100% de dano)
  damage: number;
  cooldown: number;
  kind: "melee" | "projectile";
  piercing?: boolean;             // true para a arma do futuro (w3)
  range: number;
  projectileSpeed?: number;
  color: [number, number, number];
}

export interface EnemyDef {
  id: string;
  name: string;
  era: Era;
  hp: number;
  speed: number;
  contactDamage: number;
  behavior: "patrol" | "chase" | "fly" | "shoot";
  width: number;
  height: number;
  color: [number, number, number];
  sprite?: string;
}

export type BossPattern = "chargeMelee" | "projectileBarrage" | "teleportLaser";

export interface BossDef {
  id: string;
  name: string;
  era: Era;
  hp: number;
  speed: number;
  contactDamage: number;
  pattern: BossPattern;
  attackCooldown: number;
  width: number;
  height: number;
  color: [number, number, number];
  sprite?: string;
}
```

```ts
// src/core/state.ts
import type { Era, WeaponId } from "../types";

export const state = {
  currentEra: "present" as Era,
  activeWeapon: "w1" as WeaponId,
  checkpointId: 0,
  hp: 5,
  maxHp: 5,
  special: 0, // 0..SPECIAL_MAX
  transformed: false,
  bossActive: false,
  bossDefeated: false,
  deaths: 0,
  eraHistory: [] as Era[],
};

export function resetRun(): void {
  state.currentEra = "present";
  state.activeWeapon = "w1";
  state.checkpointId = 0;
  state.hp = state.maxHp;
  state.special = 0;
  state.transformed = false;
  state.bossActive = false;
  state.bossDefeated = false;
  state.deaths = 0;
  state.eraHistory = [];
}

export function prepareCheckpointRespawn(nextEra: Era): void {
  state.currentEra = nextEra;
  state.hp = state.maxHp;
  state.transformed = false;
  state.bossActive = false;
  state.deaths += 1;
  state.eraHistory.push(nextEra);
}
```

---

## 6. Controles e Mecânicas do Player

| Ação                     | Tecla    | Detalhes                                                                 |
| ------------------------ | -------- | ------------------------------------------------------------------------ |
| Mover (Esquerda/Direita) | `A` / `D`| Velocidade base `PLAYER_SPEED` (aumenta quando transformado)             |
| Pular                    | `Espaço` | Força `JUMP_FORCE` (aumenta quando transformado)                         |
| Atacar                   | `H`      | Dispara a arma ativa (`1/2/3`) ou golpe de garras se transformado        |
| Dash                     | `J`      | Impulso horizontal rápido (`DASH_SPEED` por `DASH_DURATION`), cooldown e i-frames |
| Transformar (Lobisomem)  | `Q`      | Ativa quando `state.special >= SPECIAL_MAX` por `TRANSFORM_DURATION` s   |
| Trocar Arma              | `1`/`2`/`3` | `1` = Passado (Melee), `2` = Presente (Tiro reto), `3` = Futuro (Tiro perfurante) |

---

## 7. Sistemas principais

### 7.1 Era Director (`systems/eraDirector.ts`)

- Sorteia o tempo inicial usando **shuffle bag** (`[past, present, future]` embaralhado).
- Expõe `pickEra(): Era` (sorteio normal) e `pickDifferentEra(current: Era): Era` (usado ao morrer para **garantir** que o respawn no checkpoint ocorra em um tempo diferente do que matou o player).
- Expõe `applyEra(era)` (aplica paleta/cor de fundo, toca música/ambiente, exibe `eraBanner` e sinaliza o HUD).
- **Legibilidade do tempo (crítico):** cada Era é identificável em < 1s via paleta de fundo e plataformas, banner grande na tela e indicador permanente no HUD.

### 7.2 Weapon System (`systems/weaponSystem.ts`)

- Teclas `1`, `2`, `3` alteram `state.activeWeapon`:
  - **`w1` (Passado - Tecla `1`):** Lâmina curta corpo a corpo (`kind: "melee"`), alto dano e alcance curto à frente do player.
  - **`w2` (Presente - Tecla `2`):** Tiro reto (`kind: "projectile"`, `piercing: false`), alcance médio/longo, destrói no primeiro inimigo atingido.
  - **`w3` (Futuro - Tecla `3`):** Disparo de energia (`kind: "projectile"`, `piercing: true`), atravessa múltiplos inimigos na linha de tiro.
- Tecla `H` executa o ataque respeitando `weapon.cooldown`.
- **Regra de dano:**
  - `dano = weapon.damage * multiplicador`
  - Multiplicador é `1.0` se `weapon.era === target.era` (ou se `state.transformed === true`).
  - Caso contrário, multiplicador é `WRONG_ERA_MULT = 0.25` (25% de dano), exibindo feedback visual de resistência ("INEFETIVO" / flash acinzentado).

### 7.3 Special Meter (`systems/specialMeter.ts`)

- Enche ao acertar inimigos/Boss (`SPECIAL_GAIN_HIT`) e ao eliminar inimigos (`SPECIAL_GAIN_KILL`).
- Quando `state.special >= SPECIAL_MAX`, o HUD destaca o prompt `[Q] TRANSFORMAR`.
- Ao pressionar `Q`:
  - `state.transformed = true` durante `TRANSFORM_DURATION` segundos (a barra drena gradualmente até 0);
  - O ataque (`H`) vira **garras de lobisomem** (melee rápido e amplo que causa **100% de dano em qualquer Era**);
  - Velocidade de movimento e altura do pulo recebem multiplicadores de buff;
  - Emite eventos `"transform:start"` e `"transform:end"`.

### 7.4 Spawner & Checkpoints (`systems/spawner.ts`, `entities/checkpoint.ts`)

- O estágio único (`data/stages.ts`) define:
  - Tilemap ASCII da fase inteira (seções de plataforma + arena final do Boss);
  - Lista de **Checkpoints** (`id`, coordenadas `(x, y)`);
  - Lista de **Spawn Points de Mobs** (posições + índice de tipo `0` ou `1`, mapeado para o `enemyPool` da Era atual);
  - **Boss Spawn Point** e gatilho de fechamento da arena no final do estágio.
- Ao carregar a cena `stage`, o player nasce na posição do `state.checkpointId` atual. Spawns anteriores ao checkpoint ativo podem ser ignorados para agilizar o retorno à ação.

### 7.5 Inimigos e Boss (`entities/enemy.ts`, `entities/boss.ts`)

- **Mobs (`enemy.ts`):** Factory `makeEnemy(def: EnemyDef, pos)` com comportamentos modulares (`patrol`, `chase`, `fly`, `shoot`).
- **Boss (`boss.ts`):** Factory `makeBoss(def: BossDef, pos)` instanciada na arena final conforme a Era ativa (`data/bosses.ts`):
  - **Variante Passado (`chargeMelee`):** Boss brutal que alterna entre saltos pesados e investidas horizontais rápidas (`charge`) pela arena; vulnerável à arma `1` (Passado).
  - **Variante Presente (`projectileBarrage`):** Boss tático que mantém distância e dispara rajadas/leques de projéteis; vulnerável à arma `2` (Presente).
  - **Variante Futuro (`teleportLaser`):** Boss tecnológico que se teleporta entre pontos da arena e dispara feixes rápidos horizontais; vulnerável à arma `3` (Futuro).
  - Qualquer variante do Boss também recebe 100% de dano das garras do Lobisomem (`Q`).

---

## 8. Narrativa

- Tudo centralizado em `src/data/story.ts`:
  - `intro`: cutscene inicial com o psicólogo perguntando *"Quem está no controle, você ou o tempo?"*
  - `checkpoints` (opcional/curto): pensamentos rápidos na primeira vez que ativa cada checkpoint.
  - `ending`: diálogo de encerramento ao derrotar o Boss e responder à pergunta inicial.
- `src/ui/dialogue.ts`: caixa de diálogo com efeito typewriter, avançando com `Espaço` ou `Enter`.

---

## 9. Plano de Execução (6 Milestones em `/docs`)

O desenvolvimento está arquitetado em 6 fatias verticais documentadas na pasta `docs/`:

1. **[docs/milestone1.md](file:///c:/Users/luizm/Desktop/no-time-control/docs/milestone1.md)** — Fundação, Core, Estado & Era Director
2. **[docs/milestone2.md](file:///c:/Users/luizm/Desktop/no-time-control/docs/milestone2.md)** — Player (`A/D`, `Espaço`, Dash `J`), Estágio, Checkpoints & Respawn Temporal
3. **[docs/milestone3.md](file:///c:/Users/luizm/Desktop/no-time-control/docs/milestone3.md)** — Sistema de Armas (`1/2/3`, `H`), Projéteis & Inimigos por Era (`0.25x` / `1.0x`)
4. **[docs/milestone4.md](file:///c:/Users/luizm/Desktop/no-time-control/docs/milestone4.md)** — Barra de Especial, Transformação em Lobisomem (`Q`) & HUD Completo
5. **[docs/milestone5.md](file:///c:/Users/luizm/Desktop/no-time-control/docs/milestone5.md)** — Boss Final com 3 Variantes de Era (`bosses.ts` + `boss.ts`)
6. **[docs/milestone6.md](file:///c:/Users/luizm/Desktop/no-time-control/docs/milestone6.md)** — Narrativa (`intro`, `ending`), Polimento Visual/Feedback & Fechamento de Jam

---

## 10. Decisões de Design Fechadas

1. **Armas (`1/2/3`):** Passado (`1`) = lâmina curta melee; Presente (`2`) = tiro reto simples; Futuro (`3`) = tiro de energia que atravessa inimigos (`piercing`).
2. **Arma errada (`WRONG_ERA_MULT`):** Causa **25% de dano (`0.25`)** com feedback visual de "inefetivo". Lobisomem causa `1.0x` em qualquer Era.
3. **Controles:** `A/D` move, `Espaço` pula, `H` ataca, `J` dash, `Q` transforma, `1/2/3` seleciona arma.
4. **Estrutura de fases e Boss:** 1 estágio completo com checkpoints e 1 Boss no final. Tanto os mobs quanto o Boss variam conforme a Era ativa. Morrer faz respawn no último checkpoint sorteando obrigatoriamente uma Era diferente.
5. **Arte:** Placeholders (`k.rect()` coloridos por Era) primeiro; sprites entram depois sem alterar a lógica.
6. **Idioma:** Código em inglês; textos de UI/história em PT-BR.
