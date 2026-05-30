# The Binding of Perros — Contexto del proyecto

## Descripción general

Roguelike de acción en 2D inspirado en *The Binding of Isaac*, con temática de humor español / cultura de streamers ("Perros"). El juego usa HTML5 Canvas y JavaScript vanilla (sin frameworks). Se ejecuta en el navegador a 1280x720 con sprites pixel-art.

## Stack técnico

- HTML5 Canvas (`<canvas id="game" width="1280" height="720">`)
- JavaScript vanilla con dependencia externa: **Howler.js 2.2.4** (CDN para audio)
- CSS con diseño responsive (grid, media queries)
- localStorage para persistencia (guardado de runs y colección)
- Imágenes pixel-art cargadas con `Image` + `Promise.all`

### Estructura de ficheros

```
/public_html/
  index.html              — Punto de entrada
  style.css               — Estilos HUD, menús, pausa, colección
  LISTA_ASSETS_PENDIENTES.md — Sprites que faltan por dibujar
  assets/
    data/balance.json     — Balance de 100 salas (tipos, puertas, loot, enemigos)
    characters/           — Sprites del jugador
    environment/          — Fondos de sala, puertas
    enemies/              — Sprites de enemigos (opcionales, fallback a slime genérico)
    pickups/              — Moneda, llave, bomba, corazón
    relics/               — Sprites de reliquias (opcionales, fallback a formas geométricas)
    audio/
      enemy/              — Sonidos de muerte de enemigo (enemy-1.mp3, enemy-2.mp3)
      merchant/           — Sonidos de compra en mercader (merchant-1.mp3, merchant-2.mp3, merchant-3.mp3)
    ui/                   — Fondos de menú, HUD, cursores
  js/
    constants.js          — Todas las constantes, catálogos, ASSETS, ROOM_THEMES, RELIC_CATALOG, ENEMY_CATALOG
    game.js               — Lógica principal: salas, enemigos, disparos, objetos, HUD, pausa, debug, colección
    rendering.js          — Renderizado Canvas: menús, salas, jugador, enemigos, proyectiles, UI, partículas
    save.js               — Sistema de guardado en localStorage
    main.js               — Bucle principal, eventos input (teclado/ratón), carga de assets, orquestación
```

## Sistema de juego

### Run

- 100 salas por run, progresión lineal (sala 1 → sala 100)
- Cada sala tiene tipo determinado por `balance.json` (por sala individual) con variación aleatoria
- Boss obligatorio cada 10 salas (salas 10, 20, 30... 100)
- Sala 66 siempre es `sacrificeRoom`, sala 21 tiene 85% de ser `madShop`
- Al morir: Game Over, se guarda la mejor sala alcanzada
- Al vencer la sala 100: Victoria

### Tipos de sala

| Tipo | Descripción |
|---|---|
| `fightBasic` | Combate normal |
| `fightMixed` | Combate mixto, más enemigos |
| `fightElite` | Combate élite, enemigos más duros |
| `chestRoom` | Sala con cofres (1-3 según variante) |
| `woodChest` / `silverChest` / `goldChest` | Cofre individual (madera=0 llaves, plata=1, dorado=1) |
| `madShop` | Tienda del mercader (4 objetos, E para comprar) |
| `sacrificeRoom` | Altar de sacrificio (-1 vida por recompensa) |
| `riskEvent` | Evento de riesgo (monedas + corazón) |
| `jokeRoom` | Sala broma (0.02% de aparecer, graffiti "ROBERTO PAQUETE") |
| `boss` | Jefe (1 puerta, boss con barra de vida) |

### Temas de salas (cada 10 salas)

1. **Isaac** (sangre/carne) — Sala 1-10
2. **Japón** (japonés) — Sala 11-20
3. **Moho** (verde) — Sala 21-30
4. **Hielo** (azul) — Sala 31-40
5. **Dorado** — Sala 41-50
   — Se repite el ciclo para 51-100

Cada tema tiene su paleta de tintado (`tint`, `glow`) y enemigos específicos (`ENEMY_CATALOG`).

### Puertas

- Entre 1 y 4 puertas por sala, elegidas aleatoriamente con pesos por sala
- Puertas especiales: boss (roja), puerta bomba (explotable con consumible)
- Las puertas se abren al limpiar la sala de combate
- Las salas pre-boss (9, 19, 29...) tienen 1 única puerta que lleva al boss

### Jugador

**Stats base:**
- Vida: 6 (maxHp)
- Velocidad: 245
- Daño: 1
- Cadencia: 0.28s entre disparos (fireDelay)
- Crítico: 0%
- Defensa: 0% (daño reducido)
- Alcance de disparo: ~4s de vida del proyectil

**Controles:**
- Movimiento: WASD / Flechas
- Disparo: Espacio (dirección de movimiento), IJKL / Numpad (disparo direccional independiente), Ratón (clic)
- Interacción (comprar, abrir cofre, sacrificio): **E**
- Pausa: Escape

### Enemigos

Por cada tema, 3 tiers que escalan con la sala:

| Tier | Salas | Descripción |
|---|---|---|
| 1 | 1-3 | Básico, chase, sin disparo |
| 2 | 4-7 | Rápido o que dispara |
| 3 | 8-10 | Resistente, tanque o shooter |

**Roles:** `swarm` (coste 1), `shooter` (coste 1.45), `tank` (coste 2.35)

Los enemigos escalan en vida, velocidad y daño según `balance.json` + fórmulas por sala.

### Bosses

- Cada 10 salas: boss obligatorio
- Sala 10: **Lagrimón** (dispara en anillo, patrón spread)
- Sala 20: **Chef Nigiri** (tema Japón, invoca minions, fase 2 → **Mónica**)
- Sala 100: **Boss Final** (dispara spread 3 proyectiles, invoca ecos)

### Objetos / Reliquias

21 reliquias catalogadas con rarezas:
`Común → Poco común → Rara → Épica → Legendaria → Mítica`

Cada reliquia tiene:
- `id`, `name`, `rarity`, `type`, `effect`
- `pools`: de qué fuentes puede dropear (`fight`, `woodChest`, `silverChest`, `goldChest`, `boss`, `bossJapan`)
- `weight`: probabilidad relativa dentro de su pool
- `image`: clave de ASSETS para sprite (opcional, fallback a forma geométrica + letra)

**Ejemplos de reliquias:** Papel Higiénico, Silla Gamer, Calcetín Sucio, Hormiga, Hormiguero, Tecla, Llave de Porsche, Cable Mordido, Lijadora, Mando, ColaCao, Setup, Nigiri de Salmón, Crep de Chocolate, Palillos Chinos, Salsa de Soja, Salsa Good Soup, Rasta de Dani, Pegatina Perros, Talon, Perros Code.

### Pickups

- **Monedas** — Para comprar en tienda
- **Llaves** — Para abrir cofres de plata/dorado
- **Bombas** — Para abrir puertas bomba
- **Corazones** — Curan 1 vida

### Tienda (`madShop`)

Aparece desde sala 15 (probabilidad variable). 4 slots con objetos aleatorios. Precios escalan con rareza (8c común → 22c mítica). Tecla **E** para comprar.

### Sacrificio (`sacrificeRoom`)

Sala 66 fija. Tecla **E** para sacrificar 1 vida. Recompensa: 72% reliquia, 28% recursos.

## Progresión y guardado

### localStorage (`perros-demo-save-v1`)

```json
{
  "bestRoom": 0,
  "totalCoins": 0,
  "totalKeys": 0,
  "totalBombs": 0,
  "unlockedBlackHeart": false,
  "discoveredRelics": ["id1", "id2"],
  "currentRun": {
    "room": 1,
    "coins": 0,
    "keys": 0,
    "bombs": 0,
    "player": { "hp": 6, "maxHp": 6, "speed": 245, "damage": 1, ... }
  }
}
```

- `save.js` gestiona load/write de localStorage
- `discoveredRelics`: colección desbloqueada (visible en menú Stats)
- `currentRun`: run en curso para continuar después

## Menús

1. **Menú inicial** — Título + "Press Start" animado
2. **Menú principal** — New Run / Continue / Stats / Options (deshabilitado)
3. **Pausa** — Stats del jugador, reliquias actuales, botón Continuar/Menu/New Run
4. **Game Over** — Sala alcanzada, botón Otra Run
5. **Victoria** — Mensaje de victoria, botón Nueva Run
6. **Stats (colección)** — Cuadrícula con todas las reliquias (descubiertas/bloqueadas)

## Debug

Botón secreto en esquina inferior derecha de la pausa. Código: **2201** (4 dígitos).

Herramientas disponibles:
- Salto de sala (solo hacia adelante)
- God Mode (inmortal)
- One Shot (matar enemigos de un golpe)

## Audio

### Dependencia externa

Howler.js 2.2.4 se carga desde CDN en `index.html`. No hay package.json ni gestor de paquetes.

### Sistema SFX

`audio.js` define el objeto `SFX` con un sistema de pools:

- **Pool de sonidos:** Cada tipo de evento tiene N variantes. Al reproducir se elige una aleatoria y se aplica un `rate` variable (0.85–1.15) para que no suene siempre igual.
- **Eventos actuales:**
  - `SFX.enemyDeath()` — muerte de enemigo (`game.js:1035`)
  - `SFX.merchantBuy()` — compra en mercader (`game.js:382`)
- **Toggle:** `SFX.toggle()` activa/desactiva todo el audio. No hay botón en UI aún.
- **Formato esperado:** MP3.

### Convención de archivos

Los sonidos se colocan en `assets/audio/<evento>/<evento>-N.mp3` donde N empieza en 1. El número de variantes se configura en `SFX.init()` en `audio.js`.

### Si faltan archivos

El sistema lo tolera: `_play()` comprueba `sound.state() === "loaded"` antes de reproducir. Si el MP3 no existe, se omite silenciosamente.

## Assets pendientes

Ver `public_html/LISTA_ASSETS_PENDIENTES.md` para la lista completa de sprites que faltan: salas, puertas, enemigos, bosses, UI, efectos, audio.

## Reglas para agentes IA

1. **No añadir dependencias externas.** El proyecto es vanilla JS sin npm, build tools, ni frameworks. La única excepción es **Howler.js 2.2.4** (CDN) para audio.
2. **Mantener el estilo pixel-art.** Sprites cargados vía `ASSETS` en `constants.js` con `imageSmoothingEnabled = false`.
3. **No romper el guardado.** Las migraciones de `localStorage` deben ser compatibles hacia atrás.
4. **Balance en `balance.json`.** Los valores de difficulty, loot, door weights, enemy scaling están ahí.
5. **Código en español** (variables, comentarios, strings de UI). Mantener coherencia.
6. **Nuevas reliquias** requieren: entrada en `RELIC_CATALOG`, entrada en `RELIC_IMAGE_KEYS`, sprite en `assets/relics/`, efecto en `applyRelicEffect()`, y rarity weights consistentes.
7. **Nuevos temas** requieren: entrada en `ROOM_THEMES`, entrada en `ENEMY_CATALOG`, sprites de sala/puertas, y balance en `balance.json`.
8. **Sin refresco de página.** Todo el juego corre en un `requestAnimationFrame` loop. Las transiciones son instantáneas.
