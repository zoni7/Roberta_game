const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

ctx.imageSmoothingEnabled = false;

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const SAVE_KEY = "perros-demo-save-v1";

const ASSETS = {
  playerFront: "assets/characters/player-front.png",
  playerRight: "assets/characters/player-right.png",
  playerLeft: "assets/characters/player-left.png",
  playerItem: "assets/characters/player-item.png",
  playerDead: "assets/characters/player-dead.png",
  playerHit: "assets/characters/player-hit.png",
  slime: "assets/characters/enemy-slime.png",
  room: "assets/environment/room-red.png",
  roomJapan: "assets/environment/room-japan.png",
  menuBg: "assets/ui/menu-bg.png",
  menuPaper: "assets/ui/menu-paper.png",
  pressStart: "assets/ui/press-start.png",
  title: "assets/ui/title.png",
  newRun: "assets/ui/new-run.png",
  continue: "assets/ui/continue.png",
  stats: "assets/ui/stats.png",
  options: "assets/ui/options.png",
  heartRed: "assets/ui/heart-red.png",
  heartBlack: "assets/ui/heart-black.png",
  coin: "assets/pickups/coin.png",
  key: "assets/pickups/key.png",
  bomb: "assets/pickups/bomb.png",
  doorOpen: "assets/environment/door-open.png",
  doorClosed: "assets/environment/door-closed.png",
  doorJammed: "assets/environment/door-jammed.png",
  doorExploded: "assets/environment/door-exploded.png",
  doorBossOpen: "assets/environment/door-boss-open.png",
  doorBossClosed: "assets/environment/door-boss-closed.png",
  doorJapanOpen: "assets/environment/door-japan-open.png",
  doorJapanClosed: "assets/environment/door-japan-closed.png",
  doorJapanJammed: "assets/environment/door-japan-jammed.png",
  doorJapanExploded: "assets/environment/door-japan-exploded.png",
  doorJapanBossOpen: "assets/environment/door-japan-boss-open.png",
  doorJapanBossClosed: "assets/environment/door-japan-boss-closed.png",
  enemyNigiriAtun: "assets/enemies/nigiri-atun.png",
  enemyNigiriSalmonFlameado: "assets/enemies/nigiri-salmon-flameado.png",
  relicPapelHigienico: "assets/relics/papel-higienico.png",
  relicSillaGamer: "assets/relics/silla-gamer.png",
  relicCalcetinSucio: "assets/relics/calcetin-sucio.png",
  relicHormiga: "assets/relics/hormiga.png",
  relicHormiguero: "assets/relics/hormiguero.png",
  relicTecla: "assets/relics/tecla.png",
  relicLlavePorsche: "assets/relics/llave-porsche.png",
  relicCableMordido: "assets/relics/cable-mordido.png",
  relicMando: "assets/relics/mando.png",
  relicColacao: "assets/relics/colacao.png",
  relicSetup: "assets/relics/setup.png",
  relicNigiriSalmon: "assets/relics/nigiri-salmon.png",
  relicCrepChocolate: "assets/relics/crep-chocolate.png",
  relicSalsaGoodSoup: "assets/relics/salsa-good-soup.png",
  relicRastaDani: "assets/relics/rasta-dani.png",
  relicPegatinaPerros: "assets/relics/pegatina-perros.png",
  relicTalon: "assets/relics/talon.png",
};

const ROOM_THEMES = [
  { name: "Isaac", roomImage: "room", tint: "rgba(78, 8, 8, 0.18)", glow: "rgba(195, 45, 38, 0.22)" },
  { name: "Japon", roomImage: "roomJapan", tint: "rgba(178, 87, 38, 0.08)", glow: "rgba(255, 185, 108, 0.18)" },
  { name: "Moho", tint: "rgba(20, 74, 49, 0.18)", glow: "rgba(62, 173, 107, 0.16)" },
  { name: "Hielo", tint: "rgba(32, 72, 94, 0.18)", glow: "rgba(92, 198, 224, 0.18)" },
  { name: "Dorado", tint: "rgba(126, 92, 16, 0.16)", glow: "rgba(255, 204, 84, 0.20)" },
];

const ROOM_TYPE_NAMES = {
  fightBasic: "Pelea",
  fightMixed: "Mixta",
  fightElite: "Elite",
  chestRoom: "Cofre",
  woodChest: "Madera",
  silverChest: "Plata",
  goldChest: "Dorado",
  madShop: "Mercader",
  sacrificeRoom: "Sacrificio",
  riskEvent: "Riesgo",
  jokeRoom: "Secreta",
  boss: "Boss",
};

const NON_EMPTY_ROOM_TYPES = new Set(Object.keys(ROOM_TYPE_NAMES));
const JOKE_ROOM_CHANCE = 0.0002;
const ROOM_21_MERCHANT_CHANCE = 0.85;

const ROOM_TYPE_TABLE = [
  { value: "fightBasic", weight: 58 },
  { value: "fightMixed", weight: 18 },
  { value: "fightElite", weight: 14 },
  { value: "chestRoom", weight: 12 },
  { value: "riskEvent", weight: 6 },
];

const RELIC_RARITY_WEIGHTS = {
  fight: { "Común": 72, "Poco común": 22, "Rara": 5, "Épica": 1, "Legendaria": 0, "Mítica": 0 },
  woodChest: { "Común": 68, "Poco común": 24, "Rara": 7, "Épica": 1, "Legendaria": 0, "Mítica": 0 },
  silverChest: { "Común": 35, "Poco común": 40, "Rara": 18, "Épica": 6, "Legendaria": 1, "Mítica": 0 },
  goldChest: { "Común": 15, "Poco común": 30, "Rara": 32, "Épica": 17, "Legendaria": 5, "Mítica": 1 },
  boss: { "Común": 10, "Poco común": 26, "Rara": 36, "Épica": 20, "Legendaria": 7, "Mítica": 1 },
  bossJapan: { "Común": 6, "Poco común": 20, "Rara": 36, "Épica": 26, "Legendaria": 10, "Mítica": 2 },
};

const RELIC_CATALOG = [
  { id: "papel-higienico", name: "Papel Higiénico", rarity: "Común", type: "Supervivencia", effect: "+1 vida máxima. Al recibir daño deja 2 monedas.", pools: ["fight", "woodChest", "silverChest"], weight: 13 },
  { id: "silla-gamer", name: "Silla Gamer", rarity: "Rara", type: "Tanque", effect: "+2 vida máxima y +15% defensa, pero -6% velocidad.", pools: ["silverChest", "goldChest", "boss"], weight: 9 },
  { id: "calcetin-sucio", name: "Calcetín Sucio", rarity: "Común", type: "Veneno", effect: "+8% crítico. Los enemigos cercanos reciben daño lento.", pools: ["fight", "woodChest", "silverChest"], weight: 12 },
  { id: "hormiga", name: "Hormiga", rarity: "Poco común", type: "Enjambre", effect: "+12% velocidad y +10% cadencia. Mejora mucho con Hormiguero.", pools: ["fight", "woodChest", "silverChest"], weight: 11 },
  { id: "hormiguero", name: "Hormiguero", rarity: "Legendaria", type: "Combo", effect: "+3 daño si tienes Hormiga. Si no, +1 daño y +1 vida máxima.", pools: ["goldChest", "boss"], weight: 4 },
  { id: "tecla", name: "Tecla", rarity: "Común", type: "Cadencia", effect: "+12% cadencia.", pools: ["fight", "woodChest", "silverChest"], weight: 13 },
  { id: "llave-porsche", name: "Llave de Porsche", rarity: "Épica", type: "Velocidad", effect: "+22% velocidad, +12% cadencia y +1 llave.", pools: ["goldChest", "boss"], weight: 6 },
  { id: "cable-mordido", name: "Cable Mordido", rarity: "Poco común", type: "Electricidad", effect: "+1 daño, pero los disparos duran un poco menos.", pools: ["woodChest", "silverChest", "goldChest"], weight: 10 },
  { id: "lijadora", name: "Lijadora", rarity: "Rara", type: "Taller", effect: "+1.5 daño y lágrimas más grandes, pero -8% cadencia.", pools: ["silverChest", "goldChest", "boss"], weight: 8 },
  { id: "mando", name: "Mando", rarity: "Poco común", type: "Control", effect: "+10% cadencia y +8% crítico.", pools: ["fight", "woodChest", "silverChest"], weight: 10 },
  { id: "colacao", name: "ColaCao", rarity: "Común", type: "Curación", effect: "+1 vida máxima, cura 2 y +1 moneda por recompensa.", pools: ["fight", "woodChest", "silverChest"], weight: 11 },
  { id: "setup", name: "Setup", rarity: "Épica", type: "PC", effect: "+1 daño, +12% cadencia y +8% crítico.", pools: ["goldChest", "boss"], weight: 6 },
  { id: "nigiri-salmon", name: "Nigiri de Salmón", rarity: "Rara", type: "Sushi", effect: "Cura 2, +1 vida máxima y +8% velocidad.", pools: ["silverChest", "goldChest", "bossJapan"], weight: 9 },
  { id: "crep-chocolate", name: "Crep de Chocolate", rarity: "Poco común", type: "Postre", effect: "+1 vida máxima y +12% daño al estar tocado.", pools: ["woodChest", "silverChest", "bossJapan"], weight: 10 },
  { id: "palillos-chinos", name: "Palillos Chinos", rarity: "Rara", type: "Precisión", effect: "+16% cadencia y +12% crítico.", pools: ["silverChest", "goldChest", "bossJapan"], weight: 8 },
  { id: "salsa-soja", name: "Salsa de Soja", rarity: "Común", type: "Sushi", effect: "+10% cadencia y +1 llave.", pools: ["fight", "woodChest", "silverChest", "bossJapan"], weight: 11 },
  { id: "salsa-good-soup", name: "Salsa Good Soup", rarity: "Épica", type: "Picante", effect: "+2 daño, pero -1 vida máxima.", pools: ["goldChest", "bossJapan"], weight: 5 },
  { id: "rasta-dani", name: "Rasta de Dani", rarity: "Rara", type: "Amuleto", effect: "+15% defensa y +15% crítico.", pools: ["silverChest", "goldChest", "boss"], weight: 7 },
  { id: "pegatina-perros", name: "Pegatina Perros", rarity: "Poco común", type: "Grupo", effect: "+1 daño por cada 5 reliquias que lleves.", pools: ["fight", "woodChest", "silverChest", "goldChest"], weight: 9 },
  { id: "talon", name: "Talon", rarity: "Mítica", type: "Counter", effect: "One-shot cada 7 disparos y +2 daño.", pools: ["goldChest", "boss"], weight: 2 },
  { id: "perros-code", name: "Perros Code", rarity: "Legendaria", type: "Código", effect: "+1 a todo: daño, vida, velocidad, cadencia, crítico y suerte de llaves.", pools: ["goldChest", "boss"], weight: 3 },
];

const RELIC_IMAGE_KEYS = {
  "papel-higienico": "relicPapelHigienico",
  "silla-gamer": "relicSillaGamer",
  "calcetin-sucio": "relicCalcetinSucio",
  hormiga: "relicHormiga",
  hormiguero: "relicHormiguero",
  tecla: "relicTecla",
  "llave-porsche": "relicLlavePorsche",
  "cable-mordido": "relicCableMordido",
  mando: "relicMando",
  colacao: "relicColacao",
  setup: "relicSetup",
  "nigiri-salmon": "relicNigiriSalmon",
  "crep-chocolate": "relicCrepChocolate",
  "salsa-good-soup": "relicSalsaGoodSoup",
  "rasta-dani": "relicRastaDani",
  "pegatina-perros": "relicPegatinaPerros",
  talon: "relicTalon",
};

for (const relic of RELIC_CATALOG) {
  relic.image = RELIC_IMAGE_KEYS[relic.id] || null;
}

const DOOR_SIDES = ["top", "right", "bottom", "left"];
const DOOR_INFO = {
  top: { x: WIDTH / 2 - 56, y: 88, w: 112, h: 56 },
  right: { x: WIDTH - 130, y: HEIGHT / 2 - 56, w: 58, h: 112 },
  bottom: { x: WIDTH / 2 - 56, y: HEIGHT - 116, w: 112, h: 56 },
  left: { x: 72, y: HEIGHT / 2 - 56, w: 58, h: 112 },
};

const ENEMY_CATALOG = {
  Isaac: [
    { name: "Grumo", tier: 1, tint: "rgba(180, 35, 35, 0.28)", rScale: 1, hpScale: 1, speedScale: 1, canShoot: false },
    { name: "Vena", tier: 2, tint: "rgba(120, 0, 0, 0.38)", rScale: 0.9, hpScale: 0.85, speedScale: 1.25, canShoot: false },
    { name: "Ojo carnoso", tier: 3, tint: "rgba(255, 78, 78, 0.32)", rScale: 1.12, hpScale: 1.25, speedScale: 0.9, canShoot: true },
  ],
  Japon: [
    { name: "Nigiri pequeño", tier: 1, tint: "rgba(255, 188, 132, 0.28)", rScale: 0.92, hpScale: 0.9, speedScale: 1.04, canShoot: false },
    { name: "Sombra koi", tier: 2, tint: "rgba(215, 71, 67, 0.30)", rScale: 0.88, hpScale: 0.95, speedScale: 1.18, canShoot: true },
    { name: "Daruma pesado", tier: 3, tint: "rgba(165, 58, 42, 0.34)", rScale: 1.25, hpScale: 1.75, speedScale: 0.62, canShoot: false },
  ],
  Moho: [
    { name: "Baba verde", tier: 1, tint: "rgba(43, 175, 92, 0.30)", rScale: 1, hpScale: 1, speedScale: 1, canShoot: false },
    { name: "Espora", tier: 2, tint: "rgba(20, 118, 62, 0.38)", rScale: 0.82, hpScale: 0.8, speedScale: 1.45, canShoot: true },
    { name: "Hongo bruto", tier: 3, tint: "rgba(79, 201, 112, 0.32)", rScale: 1.25, hpScale: 1.55, speedScale: 0.76, canShoot: false },
  ],
  Hielo: [
    { name: "Gota fria", tier: 1, tint: "rgba(103, 205, 238, 0.28)", rScale: 1, hpScale: 1, speedScale: 1, canShoot: false },
    { name: "Cristal", tier: 2, tint: "rgba(63, 143, 207, 0.36)", rScale: 0.92, hpScale: 1.05, speedScale: 1.18, canShoot: true },
    { name: "Bloque helado", tier: 3, tint: "rgba(181, 239, 255, 0.32)", rScale: 1.28, hpScale: 1.7, speedScale: 0.7, canShoot: false },
  ],
  Dorado: [
    { name: "Pepita", tier: 1, tint: "rgba(248, 202, 62, 0.30)", rScale: 1, hpScale: 1, speedScale: 1, canShoot: false },
    { name: "Ladron brillo", tier: 2, tint: "rgba(255, 171, 32, 0.36)", rScale: 0.86, hpScale: 0.95, speedScale: 1.38, canShoot: false },
    { name: "Idolo", tier: 3, tint: "rgba(255, 224, 105, 0.35)", rScale: 1.2, hpScale: 1.5, speedScale: 0.82, canShoot: true },
  ],
};
const MENU_START_BOUNDS = { x: WIDTH / 2 - 150, y: 545, w: 300, h: 49 };
const MAIN_MENU_ITEMS = [
  { id: "newRun", image: "newRun", crop: { x: 340, y: 450, w: 787, h: 155 }, bounds: { x: WIDTH / 2 - 140, y: 225, w: 280, h: 55 }, enabled: () => true },
  { id: "continue", image: "continue", crop: { x: 372, y: 450, w: 741, h: 157 }, bounds: { x: WIDTH / 2 - 139, y: 306, w: 278, h: 59 }, enabled: () => hasCurrentRun() },
  { id: "stats", image: "stats", crop: { x: 462, y: 452, w: 563, h: 129 }, bounds: { x: WIDTH / 2 - 118, y: 389, w: 236, h: 54 }, enabled: () => true },
  { id: "options", image: "options", crop: { x: 360, y: 454, w: 789, h: 147 }, bounds: { x: WIDTH / 2 - 140, y: 468, w: 280, h: 52 }, enabled: () => false },
];
