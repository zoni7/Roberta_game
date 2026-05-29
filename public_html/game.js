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

const images = {};
const keys = new Set();
const mouse = { x: WIDTH / 2, y: HEIGHT / 2, down: false };

const hud = document.querySelector("#hud");
const heartsEl = document.querySelector("#hearts");
const coinsEl = document.querySelector("#coins");
const keysEl = document.querySelector("#keys");
const bombsEl = document.querySelector("#bombs");
const roomCountEl = document.querySelector("#roomCount");
const gameOver = document.querySelector("#gameOver");
const retryBtn = document.querySelector("#retryBtn");
const runSummary = document.querySelector("#runSummary");
const victory = document.querySelector("#victory");
const victoryBtn = document.querySelector("#victoryBtn");
const victorySummary = document.querySelector("#victorySummary");
const statsMenu = document.querySelector("#statsMenu");
const statsBackBtn = document.querySelector("#statsBackBtn");
const collectionRelics = document.querySelector("#collectionRelics");
const collectionProgress = document.querySelector("#collectionProgress");
const pauseMenu = document.querySelector("#pauseMenu");
const resumeBtn = document.querySelector("#resumeBtn");
const pauseMenuBtn = document.querySelector("#pauseMenuBtn");
const pauseNewRunBtn = document.querySelector("#pauseNewRunBtn");
const pauseStats = document.querySelector("#pauseStats");
const pauseRelics = document.querySelector("#pauseRelics");
const secretToolBtn = document.querySelector("#secretToolBtn");
const debugPanel = document.querySelector("#debugPanel");
const debugLock = document.querySelector("#debugLock");
const debugCodeInput = document.querySelector("#debugCodeInput");
const debugToolsPanel = document.querySelector("#debugTools");
const debugRoomSelect = document.querySelector("#debugRoomSelect");
const debugGoRoomBtn = document.querySelector("#debugGoRoomBtn");
const debugCloseBtn = document.querySelector("#debugCloseBtn");
const debugGodMode = document.querySelector("#debugGodMode");
const debugOneShot = document.querySelector("#debugOneShot");

const MENU_START_BOUNDS = { x: WIDTH / 2 - 150, y: 545, w: 300, h: 49 };
const MAIN_MENU_ITEMS = [
  { id: "newRun", image: "newRun", crop: { x: 340, y: 450, w: 787, h: 155 }, bounds: { x: WIDTH / 2 - 140, y: 225, w: 280, h: 55 }, enabled: () => true },
  { id: "continue", image: "continue", crop: { x: 372, y: 450, w: 741, h: 157 }, bounds: { x: WIDTH / 2 - 139, y: 306, w: 278, h: 59 }, enabled: () => hasCurrentRun() },
  { id: "stats", image: "stats", crop: { x: 462, y: 452, w: 563, h: 129 }, bounds: { x: WIDTH / 2 - 118, y: 389, w: 236, h: 54 }, enabled: () => true },
  { id: "options", image: "options", crop: { x: 360, y: 454, w: 789, h: 147 }, bounds: { x: WIDTH / 2 - 140, y: 468, w: 280, h: 52 }, enabled: () => false },
];
let menuPressHover = false;
let mainMenuHover = null;

let lastTime = performance.now();
let mode = "loading";
let save = loadSave();
let state = null;
const debugState = {
  panelOpen: false,
  unlocked: false,
  godMode: false,
  oneShot: false,
  selectedRoom: null,
};
let balanceData = null;

window.__perrosDebug = () => ({
  mode,
  hasCurrentRun: hasCurrentRun(),
  room: state?.room ?? 0,
  roomType: state?.roomProfile?.type ?? "none",
  chestVariant: state?.roomProfile?.chestVariant ?? null,
  doorSides: state?.roomProfile?.doorSides ?? [],
  bombDoorSide: state?.roomProfile?.bombDoorSide ?? null,
  theme: state?.roomProfile?.theme?.name ?? "",
  hp: state?.player?.hp ?? 0,
  facing: state?.player?.facing ?? "front",
  aimX: state?.player?.aimX ?? 0,
  aimY: state?.player?.aimY ?? 1,
  enemies: state?.enemies?.length ?? 0,
  chests: state?.chests?.length ?? 0,
  shopItems: state?.shopItems?.filter((item) => !item.bought).length ?? 0,
  pickups: state?.pickups?.length ?? 0,
  coins: state?.coins ?? 0,
  keys: state?.keys ?? 0,
  bombs: state?.bombs ?? 0,
  relics: state?.player?.items?.length ?? 0,
});

function loadSave() {
  try {
    const parsed = {
      bestRoom: 0,
      totalCoins: 0,
      totalKeys: 0,
      totalBombs: 0,
      unlockedBlackHeart: false,
      discoveredRelics: [],
      currentRun: null,
      ...JSON.parse(localStorage.getItem(SAVE_KEY) || "{}"),
    };
    if (!Array.isArray(parsed.discoveredRelics)) parsed.discoveredRelics = [];
    return parsed;
  } catch {
    return { bestRoom: 0, totalCoins: 0, totalKeys: 0, totalBombs: 0, unlockedBlackHeart: false, discoveredRelics: [], currentRun: null };
  }
}

function writeSave() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

function hasCurrentRun() {
  return Boolean(save.currentRun && save.currentRun.room >= 1 && save.currentRun.room <= 100);
}

function createRunState(snapshot = null) {
  state = {
    room: snapshot?.room || 1,
    player: {
      x: WIDTH / 2,
      y: HEIGHT / 2,
      r: 24,
      speed: snapshot?.player?.speed || 245,
      hp: snapshot?.player?.hp || 6,
      maxHp: snapshot?.player?.maxHp || 6,
      facing: "front",
      aimX: 0,
      aimY: 1,
      invuln: 1.15,
      hitFlash: 0,
      itemPose: 0,
      heldItem: null,
      dead: false,
      fireCooldown: 0,
      damage: snapshot?.player?.damage || 1,
      fireDelay: snapshot?.player?.fireDelay || 0.28,
      damageReduction: snapshot?.player?.damageReduction || 0,
      critChance: snapshot?.player?.critChance || 0,
      bombDamage: snapshot?.player?.bombDamage || 0,
      coinBonus: snapshot?.player?.coinBonus || 0,
      keyLuck: snapshot?.player?.keyLuck || 0,
      tearSizeBonus: snapshot?.player?.tearSizeBonus || 0,
      shotLifeBonus: snapshot?.player?.shotLifeBonus || 0,
      hurtDamageBonus: snapshot?.player?.hurtDamageBonus || 0,
      dirtyAura: snapshot?.player?.dirtyAura || 0,
      talonEvery: snapshot?.player?.talonEvery || 0,
      shotCounter: snapshot?.player?.shotCounter || 0,
      items: Array.isArray(snapshot?.player?.items) ? snapshot.player.items.map(normalizeItem) : [],
    },
    enemies: [],
    shots: [],
    enemyShots: [],
    damageNumbers: [],
    pickups: [],
    chests: [],
    shopItems: [],
    roomProfile: null,
    coins: snapshot?.coins || 0,
    keys: snapshot?.keys || 0,
    bombs: snapshot?.bombs || 0,
    cleared: false,
    message: "",
    messageTime: 0,
    shake: 0,
  };

  state.player.hp = Math.min(state.player.hp, state.player.maxHp);
}

function newRun() {
  createRunState();
  save.currentRun = null;
  spawnRoom();
  saveCurrentRun();
  setMode("game");
}

function continueRun() {
  if (!hasCurrentRun()) return;
  createRunState(save.currentRun);
  spawnRoom();
  saveCurrentRun();
  setMode("game");
}

function snapshotCurrentRun() {
  if (!state) return null;
  return {
    room: state.room,
    coins: state.coins,
    keys: state.keys,
    bombs: state.bombs,
    player: {
      hp: state.player.hp,
      maxHp: state.player.maxHp,
      speed: state.player.speed,
      damage: state.player.damage,
      fireDelay: state.player.fireDelay,
      damageReduction: state.player.damageReduction,
      critChance: state.player.critChance,
      bombDamage: state.player.bombDamage,
      coinBonus: state.player.coinBonus,
      keyLuck: state.player.keyLuck,
      tearSizeBonus: state.player.tearSizeBonus,
      shotLifeBonus: state.player.shotLifeBonus,
      hurtDamageBonus: state.player.hurtDamageBonus,
      dirtyAura: state.player.dirtyAura,
      talonEvery: state.player.talonEvery,
      shotCounter: state.player.shotCounter,
      items: state.player.items,
    },
  };
}

function saveCurrentRun() {
  if (!state || mode === "gameover" || mode === "victory") return;
  save.currentRun = snapshotCurrentRun();
  writeSave();
}

function clearCurrentRun() {
  save.currentRun = null;
  writeSave();
}

function setMode(nextMode) {
  mode = nextMode;
  hud.hidden = mode !== "game" && mode !== "paused";
  gameOver.hidden = mode !== "gameover";
  victory.hidden = mode !== "victory";
  statsMenu.hidden = mode !== "stats";
  pauseMenu.hidden = mode !== "paused";
  if (mode === "stats") renderCollection();
  if (mode === "paused") {
    renderPauseDetails();
    renderDebugPanel();
  }
  updateMenuCursor();
}

function getBalanceRow(listName, roomNumber) {
  return balanceData?.[listName]?.find((row) => row.room === Math.min(roomNumber, 100)) || null;
}

function rollRoomType(roomNumber) {
  if (roomNumber === 66) return "sacrificeRoom";
  if (roomNumber === 21 && Math.random() < ROOM_21_MERCHANT_CHANCE) return "madShop";
  const row = getBalanceRow("roomTypes", roomNumber);
  if (row?.weights) {
    return weightedChoiceFromObject(row.weights);
  }
  const isBoss = roomNumber % 10 === 0;
  return isBoss ? "boss" : weightedChoice(ROOM_TYPE_TABLE);
}

function isMandatoryRoom(roomNumber) {
  return roomNumber === 1 || roomNumber % 10 === 0 || roomNumber % 10 === 9;
}

function normalizeRoomType(type, roomNumber) {
  if (roomNumber % 10 === 0) return "boss";
  if (NON_EMPTY_ROOM_TYPES.has(type) && type !== "jokeRoom") return type;
  return "fightBasic";
}

function createRoomProfile(roomNumber, entrySide) {
  const theme = ROOM_THEMES[Math.floor((roomNumber - 1) / 10) % ROOM_THEMES.length];
  const doorRow = getBalanceRow("doors", roomNumber);
  let type = normalizeRoomType(rollRoomType(roomNumber), roomNumber);
  if (!isMandatoryRoom(roomNumber) && Math.random() < JOKE_ROOM_CHANCE) {
    type = "jokeRoom";
  }
  const doorCount = getDoorCount(type, doorRow);
  const doorSides = pickDoorSides(doorCount, entrySide);
  const bombDoorSide = pickBombDoorSide(type, doorSides, doorRow);

  return {
    roomNumber,
    type,
    theme,
    transition: getBalanceRow("roomTypes", roomNumber)?.transition || "",
    doorSides,
    bombDoorSide,
    bombDoorUsed: false,
    doorsOpen: !isCombatRoom(type),
    chestVariant: type === "chestRoom" ? rollChestVariant(roomNumber) : null,
    sacrificeUsed: false,
  };
}

function rollChestVariant(roomNumber) {
  const row = balanceData?.chestRooms?.find((item) => (
    roomNumber >= item.range?.[0] && roomNumber <= item.range?.[1]
  ));
  const variants = row?.variants?.length ? row.variants : [{ type: "woodChest", count: 1, weight: 1 }];
  return weightedChoice(variants.map((variant) => ({ value: variant, weight: variant.weight }))) || variants[0];
}

function getDoorCount(type, doorRow = null) {
  if (type === "boss") return 1;
  return weightedChoice([
    { value: 2, weight: 52 },
    { value: 3, weight: 28 },
    { value: 1, weight: 15 },
    { value: 4, weight: 5 },
  ]);
}

function pickBombDoorSide(type, doorSides, doorRow) {
  if (!doorRow || !isFightRoom(type) || doorRow.bombDoorChance <= 0) return null;
  if (Math.random() * 100 > doorRow.bombDoorChance) return null;
  const available = DOOR_SIDES.filter((side) => !doorSides.includes(side));
  if (!available.length) return null;
  return available[Math.floor(Math.random() * available.length)];
}

function isFightRoom(type) {
  return type === "fightBasic" || type === "fightMixed" || type === "fightElite";
}

function isCombatRoom(type) {
  return isFightRoom(type) || type === "riskEvent" || type === "boss";
}

function pickDoorSides(count, entrySide) {
  const sides = [...DOOR_SIDES];
  const picked = [];

  if (entrySide && sides.includes(entrySide)) {
    picked.push(entrySide);
    sides.splice(sides.indexOf(entrySide), 1);
  }

  while (picked.length < count && sides.length) {
    const index = Math.floor(Math.random() * sides.length);
    picked.push(sides.splice(index, 1)[0]);
  }

  return picked;
}

function getEnemyCount(profile) {
  if (!isCombatRoom(profile.type)) return 0;
  if (profile.type === "boss") return 1;
  const difficulty = getEnemyDifficulty();
  const typedCount = difficulty?.countsByType?.[profile.type];
  const cap = getEnemyCountCap(profile);
  if (typedCount?.length === 2) {
    return scaleEnemyCount(randomInt(typedCount[0], typedCount[1]), profile, cap);
  }
  if (difficulty?.enemyCount?.length === 2) {
    const extra = profile.type === "fightElite" ? 1 : profile.type === "fightMixed" ? 1 : profile.type === "riskEvent" ? 2 : 0;
    return scaleEnemyCount(randomInt(difficulty.enemyCount[0], difficulty.enemyCount[1]) + extra, profile, cap);
  }
  if (profile.type === "fightElite") return scaleEnemyCount(5 + Math.floor(state.room / 4), profile, cap);
  if (profile.type === "fightMixed") return scaleEnemyCount(4 + Math.floor(state.room / 5), profile, cap);
  if (profile.type === "riskEvent") return scaleEnemyCount(5 + Math.floor(state.room / 5), profile, cap);
  return scaleEnemyCount(3 + Math.floor(state.room / 2), profile, cap);
}

function scaleEnemyCount(count, profile, cap) {
  const roomPressure = Math.min(state.room, 100);
  const typeBonus = profile.type === "fightElite" ? 0.28 : profile.type === "riskEvent" ? 0.34 : profile.type === "fightMixed" ? 0.18 : 0;
  const density = 1.55 + roomPressure / 130 + typeBonus;
  const flatBonus = profile.type === "fightElite" || profile.type === "riskEvent" ? 3 : profile.type === "fightMixed" ? 2 : 1;
  return Math.min(Math.max(4, Math.round(count * density) + flatBonus), cap);
}

function getEnemyCountCap(profile) {
  if (profile.type === "fightElite" || profile.type === "riskEvent") return 50;
  if (profile.type === "fightMixed") return 44;
  return 38;
}

function getEnemySpeed(profile) {
  const difficulty = getEnemyDifficulty();
  const base = profile.type === "fightElite" || profile.type === "riskEvent" ? 50 : profile.type === "fightMixed" ? 46 : 43;
  const roomPush = Math.min(56, Math.min(state.room, 100) * 0.65);
  const speedMultiplier = 0.9 + ((difficulty?.speedMultiplier || 1) - 1) * 0.32;
  return (base + roomPush) * speedMultiplier;
}

function isFinalBoss(profile) {
  return profile?.type === "boss" && profile.roomNumber >= 100;
}

function getBossArchetype(profile) {
  if (isFinalBoss(profile)) {
    return { name: "Boss Final", tier: 3, tint: "rgba(255, 214, 90, 0.34)", rScale: 1.18, hpScale: 1.45, speedScale: 0.82, canShoot: true, pattern: "final" };
  }
  if (profile.theme.name === "Japon") {
    return { name: "Chef Nigiri", tier: 3, tint: "rgba(225, 78, 64, 0.34)", rScale: 1.1, hpScale: 1.28, speedScale: 0.72, canShoot: false, pattern: "nigiri" };
  }
  return { name: "Lagrimon", tier: 3, tint: profile.theme.glow, rScale: 1, hpScale: 1, speedScale: 0.85, canShoot: true, pattern: "spread" };
}

function getEnemyDifficulty(roomNumber = state?.room || 1) {
  return balanceData?.enemyDifficulty?.find((row) => row.room === Math.min(roomNumber, 100)) || null;
}

function spawnRoomReward(profile) {
  if (profile.type === "jokeRoom") {
    addResourceBurst("coin", 2, WIDTH / 2, HEIGHT / 2 - 34);
    return;
  }

  if (profile.type === "fightBasic" || profile.type === "fightMixed" || profile.type === "fightElite") {
    spawnFightLoot(profile.type, state.room, WIDTH / 2, HEIGHT / 2 - 34);
    return;
  }

  if (profile.type === "boss") {
    spawnBossReward(WIDTH / 2, HEIGHT / 2 - 34);
    return;
  }

  if (profile.type === "chestRoom") {
    spawnChestRoom(profile, WIDTH / 2, HEIGHT / 2 - 28);
    return;
  }

  if (profile.type === "woodChest" || profile.type === "silverChest" || profile.type === "goldChest") {
    addChest(profile.type, WIDTH / 2, HEIGHT / 2 - 28);
    return;
  }

  if (profile.type === "madShop") {
    spawnShopItems(profile);
    return;
  }

  if (profile.type === "sacrificeRoom") {
    return;
  }

  if (profile.type === "riskEvent") {
    addResourceBurst("coin", getGuaranteedCoinAmount(state.room), WIDTH / 2 - 34, HEIGHT / 2 - 34);
    addPickup("heart", images.heartRed, WIDTH / 2, HEIGHT / 2 - 34);
    return;
  }
}

function spawnShopItems(profile) {
  const roomBoost = profile.roomNumber >= 21 ? Math.min(4, Math.floor((profile.roomNumber - 20) / 20)) : 0;
  const relicOffer = chooseObject(profile.theme.name === "Japon" ? "bossJapan" : "goldChest") || chooseObject("boss") || chooseObject("fight");
  const offers = [
    relicOffer
      ? { kind: "object", label: relicOffer.name, price: relicShopPrice(relicOffer) + roomBoost, img: null, item: relicOffer }
      : { kind: "key", label: "Llave", price: 4 + roomBoost, img: images.key },
    { kind: "bomb", label: "Bomba", price: 4 + roomBoost, img: images.bomb },
    { kind: "heart", label: "Vida", price: 3 + roomBoost, img: images.heartRed },
    { kind: "nothing", label: "Nada", price: 2 + Math.floor(roomBoost / 2), img: null },
  ];
  const positions = [
    { x: WIDTH / 2 - 138, y: HEIGHT / 2 - 28 },
    { x: WIDTH / 2 - 46, y: HEIGHT / 2 - 48 },
    { x: WIDTH / 2 + 46, y: HEIGHT / 2 - 48 },
    { x: WIDTH / 2 + 138, y: HEIGHT / 2 - 28 },
  ];

  state.shopItems = offers.map((offer, index) => ({
    ...offer,
    ...positions[index],
    r: 34,
    bought: false,
    bob: Math.random() * Math.PI * 2,
  }));
}

function relicShopPrice(relic) {
  const rarity = String(relic?.rarity || "").toLowerCase();
  if (rarity.includes("mítica") || rarity.includes("mitica")) return 22;
  if (rarity.includes("legend")) return 18;
  if (rarity.includes("épica") || rarity.includes("epica")) return 15;
  if (rarity.includes("rara")) return 12;
  if (rarity.includes("poco")) return 10;
  return 8;
}

function nearestShopItem() {
  if (!state?.shopItems?.length) return null;
  let nearest = null;
  let bestDistance = Infinity;

  for (const item of state.shopItems) {
    if (item.bought) continue;
    const currentDistance = distance(state.player, item);
    if (currentDistance < bestDistance && currentDistance <= state.player.r + item.r + 30) {
      nearest = item;
      bestDistance = currentDistance;
    }
  }

  return nearest;
}

function tryBuyShopItem() {
  const item = nearestShopItem();
  if (!item) return false;

  if (state.coins < item.price) {
    state.message = "No tienes monedas";
    state.messageTime = 0.9;
    return true;
  }

  state.coins -= item.price;
  item.bought = true;

  if (item.kind === "key") {
    state.keys += 1;
    state.message = "+ llave";
  } else if (item.kind === "bomb") {
    state.bombs += 1;
    state.message = "+ bomba";
  } else if (item.kind === "heart") {
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 2);
    state.message = "+ vida";
  } else if (item.kind === "object") {
    const relic = normalizeItem(item.item);
    state.player.items.push(relic);
    discoverRelic(relic);
    applyObject(relic);
    state.player.itemPose = 1.15;
    state.player.heldItem = { kind: "object", item: relic };
    state.message = relic.name;
  } else {
    state.message = "El mercader se rie";
  }

  state.messageTime = 1.05;
  saveCurrentRun();
  return true;
}

function tryUseSacrifice() {
  const profile = state?.roomProfile;
  if (profile?.type !== "sacrificeRoom") return false;
  if (profile.sacrificeUsed) return false;
  if (distance(state.player, { x: WIDTH / 2, y: HEIGHT / 2 - 10 }) > state.player.r + 62) return false;

  if (state.player.hp <= 1) {
    state.message = "Necesitas vida";
    state.messageTime = 0.9;
    return true;
  }

  state.player.hp -= 1;
  profile.sacrificeUsed = true;
  state.shake = 0.22;
  state.message = "Sacrificio";
  state.messageTime = 1.1;

  const reward = chooseObject("boss") || chooseObject("goldChest") || chooseObject("fight");
  if (reward && Math.random() < 0.72) {
    addPickup("object", null, WIDTH / 2, HEIGHT / 2 - 90, reward);
  } else {
    addResourceBurst("coin", randomInt(4, 8), WIDTH / 2 - 28, HEIGHT / 2 - 74);
    addResourceBurst(Math.random() < 0.5 ? "key" : "bomb", 1, WIDTH / 2 + 42, HEIGHT / 2 - 74);
  }

  saveCurrentRun();
  return true;
}

function spawnFightLoot(fightType, roomNumber, x, y) {
  addResourceBurst("coin", getGuaranteedCoinAmount(roomNumber), x - 26, y);
  const loot = getFightLootRow(fightType, roomNumber);
  if (!loot) {
    addResourceBurst("coin", 1, x + 22, y);
    return;
  }

  const reward = weightedChoiceFromObject(loot.weights);
  if (reward === "nothing") return;
  if (reward === "coins") {
    const quantity = loot.quantities?.coins || loot.coinQuantity || [1, 1];
    const amount = randomInt(quantity[0] || 1, quantity[1] || 1);
    addResourceBurst("coin", amount, x + 22, y);
    return;
  }
  if (reward === "woodChest" || reward === "silverChest" || reward === "goldChest") {
    addChest(reward, x, y);
    return;
  }
  if (reward === "object") {
    addPickup("object", null, x, y, chooseObject("fight"));
    return;
  }
  if (reward === "consumable") {
    addResourceBurst(Math.random() < 0.5 ? "coin" : "heart", 1, x, y);
    return;
  }
  addPickup(reward, null, x, y);
}

function getGuaranteedCoinAmount(roomNumber) {
  if (roomNumber >= 80) return randomInt(3, 5);
  if (roomNumber >= 40) return randomInt(2, 4);
  return randomInt(1, 3);
}

function getFightLootRow(fightType, roomNumber) {
  return balanceData?.fightLoot?.find((row) => (
    row.fightType === fightType && roomNumber >= row.range[0] && roomNumber <= row.range[1]
  )) || null;
}

function spawnBossReward(x, y) {
  addResourceBurst("coin", getGuaranteedCoinAmount(state.room) + 2, x - 70, y);
  const objectSource = state.room === 20 ? "bossJapan" : "boss";
  const bossRelic = chooseObject(objectSource) || chooseObject("boss") || chooseObject("fight");
  if (bossRelic) {
    addPickup("object", null, x + 2, y - 24, bossRelic);
  }
  const loot = balanceData?.bossLoot?.length ? balanceData.bossLoot : [
    { reward: "heart", probability: 100, quantity: [1, 1] },
  ];
  let offset = -42;

  for (const entry of loot) {
    if (String(entry.reward).toLowerCase() === "object") continue;
    if (Math.random() * 100 > Number(entry.probability || 0)) continue;
    const quantity = entry.quantity || [1, 1];
    const amount = randomInt(quantity[0] || 1, quantity[1] || 1);
    const px = x + offset;
    offset += 32;
    spawnInternalReward(entry.reward, px, y, amount, entry.label, objectSource);
  }
}

function spawnChestRoom(profile, x, y) {
  const variant = profile.chestVariant || { type: "woodChest", count: 1 };
  const count = Math.max(1, Math.min(3, Number(variant.count || 1)));
  const positions = count === 1
    ? [{ x, y }]
    : count === 2
      ? [{ x: x - 48, y }, { x: x + 48, y }]
      : [{ x, y: y - 36 }, { x: x - 62, y: y + 36 }, { x: x + 62, y: y + 36 }];

  for (const position of positions) {
    addChest(variant.type || "woodChest", position.x, position.y);
  }
}

function spawnChestLoot(chestType, x, y) {
  const chestName = chestType === "goldChest" ? "dorado" : chestType === "silverChest" ? "plata" : "madera";
  const options = balanceData?.chestLoot
    ?.filter((row) => String(row.chest).includes(chestName))
    ?.map((row) => ({ value: row.reward, weight: row.probability })) || [];
  const reward = options.length ? weightedChoice(options) : "Monedas";
  spawnRewardByName(reward, x, y, chestType);
}

function spawnInternalReward(reward, x, y, amount = 1, label = "", objectSource = "fight") {
  if (reward === "coins") {
    addResourceBurst("coin", amount, x, y);
    return;
  }
  if (reward === "key" || reward === "bomb" || reward === "heart") {
    addResourceBurst(reward, amount, x, y);
    return;
  }
  if (reward === "object") {
    addPickup("object", null, x, y, chooseObject(objectSource));
    return;
  }
  if (reward === "woodChest" || reward === "silverChest" || reward === "goldChest") {
    addChest(reward, x, y);
    return;
  }
  spawnRewardByName(label || reward, x, y, objectSource);
}

function addChest(chestType, x, y) {
  state.chests.push({
    chestType,
    x,
    y,
    r: 38,
    bob: Math.random() * Math.PI * 2,
    opened: false,
  });
}

function chestCost(chestType) {
  if (chestType === "woodChest") return 0;
  if (chestType === "silverChest") return 1;
  return 1;
}

function nearestClosedChest() {
  if (!state?.chests?.length) return null;
  let nearest = null;
  let bestDistance = Infinity;

  for (const chest of state.chests) {
    if (chest.opened) continue;
    const currentDistance = distance(state.player, chest);
    if (currentDistance < bestDistance && currentDistance <= state.player.r + chest.r + 34) {
      nearest = chest;
      bestDistance = currentDistance;
    }
  }

  return nearest;
}

function tryOpenNearbyChest() {
  const chest = nearestClosedChest();
  if (!chest) return false;

  const cost = chestCost(chest.chestType);
  if (cost > 0 && state.keys < cost) {
    state.message = "Necesitas llave";
    state.messageTime = 0.9;
    return true;
  }

  state.keys -= cost;
  chest.opened = true;
  state.message = cost > 0 ? "- llave" : "Cofre abierto";
  state.messageTime = 1.0;
  spawnChestLoot(chest.chestType, chest.x, chest.y - 18);
  state.chests = state.chests.filter((item) => !item.opened);
  saveCurrentRun();
  return true;
}

function spawnBombDoorReward(x, y) {
  const options = balanceData?.bombDoorLoot?.map((row) => ({ value: row.reward, weight: row.probability })) || [];
  const reward = options.length ? weightedChoice(options) : "Monedas";
  spawnRewardByName(reward, x, y, "fight");
}

function spawnRewardByName(rewardName, x, y, objectSource = "fight") {
  const text = String(rewardName).toLowerCase();
  if (text === "coins" || text.includes("moneda")) {
    addResourceBurst("coin", randomInt(2, 6), x, y);
  } else if (text === "key" || text.includes("llave")) {
    addResourceBurst("key", text.includes("x2") ? 2 : 1, x, y);
  } else if (text === "bomb" || text.includes("bomba")) {
    addResourceBurst("bomb", text.includes("x2") ? 2 : 1, x, y);
  } else if (text === "heart" || text.includes("corazón") || text.includes("curación")) {
    addResourceBurst("heart", 1, x, y);
  } else if (text === "object" || text.includes("objeto") || text.includes("reliquia")) {
    addPickup("object", null, x, y, chooseObject(objectSource, rarityFromText(text)));
  } else if (text.includes("cofre") && (text.includes("dorado") || text.includes("oro"))) {
    addChest("goldChest", x, y);
  } else if (text.includes("cofre") && text.includes("plata")) {
    addChest("silverChest", x, y);
  } else if (text.includes("cofre")) {
    addChest("woodChest", x, y);
  } else {
    addPickup("coin", images.coin, x, y);
  }
}

function addResourceBurst(type, amount, x, y) {
  const total = Math.min(amount, 8);
  for (let i = 0; i < total; i += 1) {
    const angle = (Math.PI * 2 * i) / total;
    const radius = total === 1 ? 0 : 28;
    addPickup(type, null, x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
  }
}

function chooseObject(source = "fight", preferredRarity = null) {
  const catalog = RELIC_CATALOG.length ? RELIC_CATALOG : (balanceData?.objects || []);
  const owned = getOwnedRelicIds();
  const availableCatalog = catalog.filter((item) => !owned.has(item.id || hashString(item.name || item.Objeto || "Reliquia")));
  if (!availableCatalog.length) return null;

  const rarity = preferredRarity || rollObjectRarity(source);
  const pool = getRelicPool(source, rarity, availableCatalog);
  return normalizeItem(weightedChoice(pool.map((item) => ({
    value: item,
    weight: Number(item.weight || 1),
  }))) || pool[0] || availableCatalog[0]);
}

function getOwnedRelicIds() {
  const ids = new Set((state?.player?.items || []).map((item) => normalizeItem(item).id));
  for (const pickup of state?.pickups || []) {
    if (pickup.type === "object" && pickup.item) ids.add(normalizeItem(pickup.item).id);
  }
  for (const shopItem of state?.shopItems || []) {
    if (!shopItem.bought && shopItem.kind === "object" && shopItem.item) {
      ids.add(normalizeItem(shopItem.item).id);
    }
  }
  return ids;
}

function rollObjectRarity(source) {
  const weights = RELIC_RARITY_WEIGHTS[source] || RELIC_RARITY_WEIGHTS.fight;
  return weightedChoiceFromObject(weights) || "Común";
}

function getRelicPool(source, rarity, catalog) {
  const sourcePool = catalog.filter((item) => relicCanDropFrom(item, source));
  const rarityPool = sourcePool.filter((item) => item.rarity === rarity);
  if (rarityPool.length) return rarityPool;
  if (sourcePool.length) return sourcePool;
  return catalog;
}

function relicCanDropFrom(item, source) {
  if (!item.pools?.length) return true;
  if (source === "bossJapan") return item.pools.includes("bossJapan") || item.pools.includes("boss");
  return item.pools.includes(source);
}

function rarityFromText(text) {
  if (text.includes("mítica") || text.includes("mitica")) return "Mítica";
  if (text.includes("legend")) return "Legendaria";
  if (text.includes("épica") || text.includes("epica")) return "Épica";
  if (text.includes("rara")) return "Rara";
  if (text.includes("poco")) return "Poco común";
  if (text.includes("común") || text.includes("comun")) return "Común";
  return null;
}

function normalizeItem(item = {}) {
  const name = item.name || item.Objeto || "Reliquia";
  return {
    id: item.id || hashString(name),
    name,
    rarity: item.rarity || item.Rareza || "Común",
    type: item.type || item.Tipo || "Reliquia",
    effect: item.effect || item.Efecto || "+ poder",
    penalty: item.penalty || item["Penalización/nota"] || item.note || null,
    price: item.price || item.normalPrice || item["Precio sugerido"] || null,
    visualSeed: item.visualSeed || hashString(name),
    image: item.image || RELIC_IMAGE_KEYS[item.id] || null,
    pools: item.pools || [],
    weight: item.weight || 1,
  };
}

function addPickup(type, img, x, y, item = null) {
  if (type === "object" && !item) return;
  const image = img || (type === "object" ? null : pickupImage(type));
  state.pickups.push({ type, img: image, x, y, r: 26, bob: 0, item: item ? normalizeItem(item) : null });
}

function pickupImage(type) {
  if (type === "coin") return images.coin;
  if (type === "key") return images.key;
  if (type === "bomb") return images.bomb;
  return images.heartRed;
}

function weightedChoice(entries) {
  const filtered = entries.filter((entry) => Number(entry.weight) > 0);
  const choices = filtered.length ? filtered : entries;
  const total = choices.reduce((sum, entry) => sum + Number(entry.weight || 0), 0);
  if (total <= 0) return choices[0]?.value;
  let roll = Math.random() * total;
  for (const entry of choices) {
    roll -= Number(entry.weight || 0);
    if (roll <= 0) return entry.value;
  }
  return choices[choices.length - 1].value;
}

function weightedChoiceFromObject(weights) {
  return weightedChoice(Object.entries(weights).map(([value, weight]) => ({ value, weight })));
}

function randomInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function spawnRoom(entrySide = null) {
  state.enemies = [];
  state.shots = [];
  state.enemyShots = [];
  state.damageNumbers = [];
  state.pickups = [];
  state.chests = [];
  state.shopItems = [];
  state.cleared = false;
  state.message = "";
  state.roomProfile = createRoomProfile(state.room, entrySide);

  const profile = state.roomProfile;
  const enemyBudget = Math.max(isCombatRoom(profile.type) ? 1 : 0, getEnemyCount(profile));
  let spentBudget = 0;
  let i = 0;
  while (spentBudget < enemyBudget && i < 64) {
    const edge = i % 4;
    const x = edge === 0 ? 230 : edge === 1 ? WIDTH - 230 : 260 + Math.random() * (WIDTH - 520);
    const y = edge === 2 ? 175 : edge === 3 ? HEIGHT - 150 : 170 + Math.random() * (HEIGHT - 320);
    const isBoss = profile.type === "boss";
    const isFinal = isFinalBoss(profile);
    const archetype = selectEnemyArchetype(profile, i);
    const role = getEnemyRole(archetype, profile);
    spentBudget += getEnemySpawnCost(role);
    const difficulty = getEnemyDifficulty();
    const hpMultiplier = difficulty?.hpMultiplier || 1;
    const damageMultiplier = difficulty?.damageMultiplier || 1;
    const speedMultiplier = difficulty?.speedMultiplier || 1;
    const baseHp = isFinal ? 180 * archetype.hpScale : isBoss ? (22 + Math.floor(state.room / 3)) * archetype.hpScale : (3 + Math.floor(state.room / 9)) * archetype.hpScale * getEnemyRoleHpMultiplier(role);
    const hp = Math.max(1, Math.round(baseHp * hpMultiplier));
    const baseSpeed = isFinal ? 74 * archetype.speedScale : isBoss ? (34 + Math.floor(state.room / 8)) * archetype.speedScale : getEnemySpeed(profile) * getEnemyRoleSpeedScale(archetype, role);
    const speed = isBoss ? baseSpeed * (0.88 + (speedMultiplier - 1) * 0.22) : baseSpeed;
    const damage = Math.max(1, Math.floor(damageMultiplier));
    state.enemies.push({
      x,
      y,
      r: (isFinal ? 62 : isBoss ? 46 : 23) * archetype.rScale,
      hp,
      maxHp: hp,
      speed,
      wobble: Math.random() * 10,
      shoot: isFinal ? 0.45 : isBoss || archetype.canShoot ? 0.9 + Math.random() * 0.7 : 99,
      summon: isBoss ? 2.2 + Math.random() * 0.9 : 99,
      hit: 0,
      boss: isBoss,
      finalBoss: isFinal,
      damage,
      name: archetype.name,
      tint: archetype.tint,
      canShoot: isBoss || archetype.canShoot,
      role,
      pattern: archetype.pattern || "",
      phase: archetype.phase || 1,
    });
    i += 1;
  }
}

function selectEnemyArchetype(profile, index) {
  if (profile.type === "boss") {
    return getBossArchetype(profile);
  }

  const tier = enemyTierForRoom(state.room);
  const themeList = ENEMY_CATALOG[profile.theme.name] || ENEMY_CATALOG.Isaac;
  const tierBonus = profile.type === "fightElite" || profile.type === "fightMixed" || profile.type === "riskEvent" ? 1 : 0;
  const available = themeList.filter((enemy) => enemy.tier <= tier + tierBonus);
  const pool = available.length ? available : themeList;
  return pool[(index + Math.floor(Math.random() * pool.length)) % pool.length];
}

function getEnemyRole(archetype, profile) {
  if (profile.type === "boss") return "boss";
  if (archetype.hpScale >= 1.42 || archetype.rScale >= 1.18) return "tank";
  if (archetype.speedScale >= 1.25 && archetype.hpScale <= 1) return "runner";
  if (archetype.canShoot) return "shooter";
  return "swarm";
}

function getEnemySpawnCost(role) {
  if (role === "tank") return 2.35;
  if (role === "shooter") return 1.45;
  return 1;
}

function getEnemyRoleHpMultiplier(role) {
  if (role === "tank") return 1.85;
  if (role === "shooter") return 1.2;
  if (role === "runner") return 0.78;
  return 1;
}

function getEnemyRoleSpeedScale(archetype, role) {
  if (role === "tank") return archetype.speedScale * 0.58;
  if (role === "shooter") return archetype.speedScale * 0.74;
  if (role === "runner") return Math.min(1.12, archetype.speedScale * 0.84);
  return archetype.speedScale * 0.86;
}

function enemyTierForRoom(roomNumber) {
  const position = ((roomNumber - 1) % 10) + 1;
  if (position <= 3) return 1;
  if (position <= 7) return 2;
  return 3;
}

function completeRoom() {
  if (state.cleared) return;

  state.cleared = true;
  state.roomProfile.doorsOpen = true;
  save.bestRoom = Math.max(save.bestRoom, state.room);
  writeSave();

  if (isFinalBoss(state.roomProfile)) {
    winRun();
    return;
  }

  spawnRoomReward(state.roomProfile);

  if (state.roomProfile.type === "boss") {
    state.message = "Boss derrotado";
    state.messageTime = 1.2;
  } else {
    state.message = "";
    state.messageTime = 0;
  }
  saveCurrentRun();
}

function nextRoom(exitSide = null) {
  if (state.room >= 100) return;
  state.room += 1;
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + 1);
  state.player.invuln = 0.9;
  spawnRoom(oppositeSide(exitSide));
  placePlayerAtEntrance(oppositeSide(exitSide));
  saveCurrentRun();
}

function gameOverRun() {
  save.bestRoom = Math.max(save.bestRoom, state.room);
  save.currentRun = null;
  writeSave();
  runSummary.textContent = `Has llegado a la sala ${state.room}. Mejor sala: ${save.bestRoom}.`;
  setMode("gameover");
}

function winRun() {
  save.bestRoom = 100;
  save.currentRun = null;
  writeSave();
  state.message = "Victoria";
  state.messageTime = 2;
  victorySummary.textContent = "Has derrotado al boss de la sala 100.";
  setMode("victory");
}

function update(dt) {
  if (mode !== "game") return;

  const player = state.player;
  player.invuln = Math.max(0, player.invuln - dt);
  player.hitFlash = Math.max(0, player.hitFlash - dt);
  player.itemPose = Math.max(0, player.itemPose - dt);
  player.fireCooldown = Math.max(0, player.fireCooldown - dt);
  state.messageTime = Math.max(0, state.messageTime - dt);
  state.shake = Math.max(0, state.shake - dt);

  updatePlayer(dt);
  updateShots(dt);
  updateDamageNumbers(dt);
  updateEnemies(dt);
  updateChests(dt);
  updatePickups(dt);

  if (!state.cleared && state.enemies.length === 0) {
    completeRoom();
  }

  syncHud();
}

function updatePlayer(dt) {
  const player = state.player;
  let mx = 0;
  let my = 0;

  if (keys.has("KeyA") || keys.has("ArrowLeft")) mx -= 1;
  if (keys.has("KeyD") || keys.has("ArrowRight")) mx += 1;
  if (keys.has("KeyW") || keys.has("ArrowUp")) my -= 1;
  if (keys.has("KeyS") || keys.has("ArrowDown")) my += 1;

  const mag = Math.hypot(mx, my) || 1;
  player.x += (mx / mag) * player.speed * dt;
  player.y += (my / mag) * player.speed * dt;

  const exitSide = getDoorExit(player);
  if (exitSide) {
    if (exitSide.startsWith("bomb:")) {
      openBombDoor(exitSide.slice(5));
      return;
    }
    nextRoom(exitSide);
    return;
  }

  player.x = clamp(player.x, 108, WIDTH - 108);
  player.y = clamp(player.y, 104, HEIGHT - 82);

  if (mx || my) {
    player.aimX = mx / mag;
    player.aimY = my / mag;
  }

  if (mx < 0) {
    player.facing = mx < 0 ? "left" : "right";
  } else if (mx > 0) {
    player.facing = "right";
  } else {
    player.facing = "front";
  }

  const sx = Number(keys.has("KeyL") || keys.has("Numpad6")) - Number(keys.has("KeyJ") || keys.has("Numpad4"));
  const sy = Number(keys.has("KeyK") || keys.has("Numpad2")) - Number(keys.has("KeyI") || keys.has("Numpad8"));
  const arrowShootX = Number(keys.has("ArrowRight")) - Number(keys.has("ArrowLeft"));
  const arrowShootY = Number(keys.has("ArrowDown")) - Number(keys.has("ArrowUp"));

  if (mouse.down) {
    fireAt(mouse.x - player.x, mouse.y - player.y);
  } else if (sx || sy) {
    fireAt(sx, sy);
  } else if (keys.has("Space")) {
    fireAt(player.aimX, player.aimY);
  } else if ((arrowShootX || arrowShootY) && !(keys.has("KeyW") || keys.has("KeyA") || keys.has("KeyS") || keys.has("KeyD"))) {
    fireAt(arrowShootX, arrowShootY);
  }
}

function fireAt(dx, dy) {
  const player = state.player;
  if (player.fireCooldown > 0) return;

  const length = Math.hypot(dx, dy);
  if (!length) return;

  const nx = dx / length;
  const ny = dy / length;
  player.fireCooldown = player.fireDelay;
  player.aimX = nx;
  player.aimY = ny;
  player.shotCounter = (player.shotCounter || 0) + 1;
  const critical = Math.random() < (player.critChance || 0);
  const talonShot = player.talonEvery > 0 && player.shotCounter % player.talonEvery === 0;
  const hurtBonus = player.hp <= Math.ceil(player.maxHp / 2) ? (player.hurtDamageBonus || 0) : 0;
  const shotDamage = (player.damage * (1 + hurtBonus)) * (critical ? 2 : 1);

  if (nx < -0.25) {
    player.facing = nx < 0 ? "left" : "right";
  } else if (nx > 0.25) {
    player.facing = "right";
  } else {
    player.facing = "front";
  }

  state.shots.push({
    x: player.x + nx * 24,
    y: player.y + ny * 22,
    vx: nx * 560,
    vy: ny * 560,
    r: (critical ? 10 : 8) + (player.tearSizeBonus || 0),
    life: Math.max(1.8, 4.0 + (player.shotLifeBonus || 0)),
    damage: shotDamage,
    critical: critical || talonShot,
    talonShot,
  });
}

function updateShots(dt) {
  for (const shot of state.shots) {
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    shot.life -= dt;
  }

  for (const shot of state.enemyShots) {
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    shot.life -= dt;
  }

  for (const enemy of state.enemies) {
    enemy.hit = Math.max(0, enemy.hit - dt);
    for (const shot of state.shots) {
      if (shot.life > 0 && distance(enemy, shot) < enemy.r + shot.r) {
        const damage = debugState.oneShot || shot.talonShot ? Math.max(enemy.hp, shot.damage) : shot.damage;
        enemy.hp -= damage;
        enemy.hit = 0.15;
        shot.life = 0;
        if (tryReincarnateBoss(enemy)) {
          addDamageNumber(enemy, damage, true);
          state.shake = 0.35;
          break;
        }
        addDamageNumber(enemy, damage, Boolean(shot.critical || debugState.oneShot || shot.talonShot));
        state.shake = 0.05;
      }
    }
  }

  const player = state.player;
  for (const shot of state.enemyShots) {
    if (shot.life > 0 && player.invuln <= 0 && distance(player, shot) < player.r + shot.r) {
      hurtPlayer(shot.damage || 1);
      shot.life = 0;
    }
  }

  state.enemies = state.enemies.filter((enemy) => enemy.hp > 0);
  state.shots = state.shots.filter((shot) => shot.life > 0 && inBounds(shot.x, shot.y, 720));
  state.enemyShots = state.enemyShots.filter((shot) => shot.life > 0 && inBounds(shot.x, shot.y, 90));
}

function addDamageNumber(enemy, damage, critical = false) {
  if (!state) return;
  state.damageNumbers.push({
    x: enemy.x + (Math.random() - 0.5) * enemy.r * 0.8,
    y: enemy.y - enemy.r - 12,
    vx: (Math.random() - 0.5) * 32,
    value: Math.max(1, Math.round(damage)),
    life: critical ? 0.78 : 0.62,
    maxLife: critical ? 0.78 : 0.62,
    critical,
  });
}

function tryReincarnateBoss(enemy) {
  if (!enemy.boss || enemy.hp > 0 || state.room !== 20 || enemy.phase === 2) return false;
  const nextHp = Math.max(55, Math.round(enemy.maxHp * 0.72));
  enemy.phase = 2;
  enemy.name = "Mónica";
  enemy.pattern = "monica";
  enemy.tint = "rgba(255, 124, 160, 0.36)";
  enemy.hp = nextHp;
  enemy.maxHp = nextHp;
  enemy.speed *= 1.08;
  enemy.canShoot = false;
  enemy.shoot = 99;
  enemy.summon = 0.6;
  state.message = "Mónica entra";
  state.messageTime = 1.1;
  return true;
}

function updateDamageNumbers(dt) {
  for (const number of state.damageNumbers) {
    number.life -= dt;
    number.x += number.vx * dt;
    number.y -= (number.critical ? 68 : 54) * dt;
  }
  state.damageNumbers = state.damageNumbers.filter((number) => number.life > 0);
}

function updateEnemies(dt) {
  const player = state.player;

  for (const enemy of state.enemies) {
    enemy.wobble += dt * 8;
    enemy.shoot -= dt;

    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const mag = Math.hypot(dx, dy) || 1;

    if (enemy.boss) {
      updateBossMovement(enemy, dx, dy, mag, dt);
    } else {
      enemy.x += (dx / mag) * enemy.speed * dt;
      enemy.y += (dy / mag) * enemy.speed * dt;
      enemy.x += Math.sin(enemy.wobble) * 12 * dt;
      enemy.y += Math.cos(enemy.wobble * 0.7) * 10 * dt;
    }
    enemy.x = clamp(enemy.x, 112, WIDTH - 112);
    enemy.y = clamp(enemy.y, 104, HEIGHT - 86);

    if (distance(player, enemy) < player.r + enemy.r && player.invuln <= 0) {
      hurtPlayer(enemy.damage || 1);
    }

    if ((player.dirtyAura || 0) > 0 && !enemy.boss && distance(player, enemy) < 112) {
      enemy.hp -= player.dirtyAura * dt * 0.85;
      enemy.hit = Math.max(enemy.hit, 0.05);
    }

    if (enemy.canShoot && enemy.shoot <= 0 && state.room >= 2) {
      enemy.shoot = enemy.finalBoss ? 0.5 + Math.random() * 0.25 : enemy.boss ? 0.95 + Math.random() * 0.55 : 1.7 + Math.random() * 1.2;
      const shotSpeed = enemy.finalBoss ? 360 : enemy.boss ? 300 : 260;
      const vx = (dx / mag) * shotSpeed;
      const vy = (dy / mag) * shotSpeed;
      state.enemyShots.push({ x: enemy.x, y: enemy.y, vx, vy, r: enemy.finalBoss ? 9 : 7, life: 2, damage: enemy.damage || 1 });

      if (enemy.finalBoss) {
        const angle = Math.atan2(dy, dx);
        for (const spread of [-0.34, 0.34]) {
          state.enemyShots.push({
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(angle + spread) * shotSpeed,
            vy: Math.sin(angle + spread) * shotSpeed,
            r: 8,
            life: 2,
            damage: enemy.damage || 1,
          });
        }
      }
    }

    if (enemy.boss) {
      updateBossPattern(enemy, dx, dy, mag, dt);
    }
  }
}

function updateBossMovement(enemy, dx, dy, mag, dt) {
  const keepAway = mag < 230 ? -0.45 : 0.75;
  const orbit = enemy.pattern === "nigiri" || enemy.pattern === "monica" ? 0.34 : 0.22;
  enemy.x += ((dx / mag) * keepAway + (-dy / mag) * orbit) * enemy.speed * dt;
  enemy.y += ((dy / mag) * keepAway + (dx / mag) * orbit) * enemy.speed * dt;
  enemy.x += Math.sin(enemy.wobble * 0.5) * 8 * dt;
  enemy.y += Math.cos(enemy.wobble * 0.45) * 8 * dt;
}

function updateBossPattern(enemy, dx, dy, mag, dt) {
  enemy.summon -= dt;
  if (enemy.pattern === "nigiri" && enemy.summon <= 0) {
    enemy.summon = state.room === 20 ? 0.72 + Math.random() * 0.22 : 1.35 + Math.random() * 0.45;
    summonBossMinions(enemy, "nigiri", state.room === 20 ? 6 : 4);
    return;
  }

  if (enemy.pattern === "monica" && enemy.summon <= 0) {
    enemy.summon = 0.82 + Math.random() * 0.26;
    summonBossMinions(enemy, "salmon", 5);
    return;
  }

  if (enemy.pattern === "final" && enemy.summon <= 0) {
    enemy.summon = 1.8 + Math.random() * 0.5;
    summonBossMinions(enemy, "final", 4);
    return;
  }

  if (enemy.pattern === "spread" && enemy.summon <= 0) {
    enemy.summon = 2.2 + Math.random() * 0.6;
    shootBossRing(enemy, 8, 220);
  }
}

function summonBossMinions(boss, kind, count) {
  const livingMinions = state.enemies.filter((enemy) => !enemy.boss).length;
  const minionCap = state.room === 20 ? 44 : 24;
  if (livingMinions > minionCap) return;

  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.7;
    const radius = 74 + Math.random() * 34;
    const isFinal = kind === "final";
    const isSalmon = kind === "salmon";
    const hp = isFinal ? 7 + Math.floor(state.room / 18) : isSalmon ? 3 : 2;
    state.enemies.push({
      x: clamp(boss.x + Math.cos(angle) * radius, 112, WIDTH - 112),
      y: clamp(boss.y + Math.sin(angle) * radius, 104, HEIGHT - 86),
      r: isFinal ? 20 : isSalmon ? 20 : 18,
      hp,
      maxHp: hp,
      speed: isFinal ? 86 : isSalmon ? 132 : 124,
      wobble: Math.random() * 10,
      shoot: isFinal ? 1.2 : 99,
      summon: 99,
      hit: 0,
      boss: false,
      finalBoss: false,
      damage: isFinal ? boss.damage : 1,
      name: isFinal ? "Eco" : isSalmon ? "Salmón flameado" : "Nigiri de atún",
      tint: isFinal ? "rgba(255, 225, 95, 0.28)" : isSalmon ? "rgba(255, 118, 72, 0.34)" : "rgba(255, 245, 210, 0.32)",
      canShoot: isFinal,
      role: "swarm",
      pattern: "",
      sprite: isFinal ? null : isSalmon ? "enemyNigiriSalmonFlameado" : "enemyNigiriAtun",
    });
  }
}

function shootBossRing(enemy, count, speed) {
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count + enemy.wobble * 0.08;
    state.enemyShots.push({
      x: enemy.x,
      y: enemy.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: 7,
      life: 2.6,
      damage: enemy.damage || 1,
    });
  }
}

function updatePickups(dt) {
  for (const pickup of state.pickups) {
    pickup.bob += dt * 4;
    if (distance(state.player, pickup) < state.player.r + pickup.r) {
      collectPickup(pickup);
      pickup.collected = true;
    }
  }

  state.pickups = state.pickups.filter((pickup) => !pickup.collected);
}

function updateChests(dt) {
  for (const chest of state.chests) {
    chest.bob += dt * 3;
  }
}

function collectPickup(pickup) {
  const player = state.player;
  player.itemPose = 1.15;
  player.heldItem = pickup.type === "object"
    ? { kind: "object", item: normalizeItem(pickup.item) }
    : { kind: "image", img: pickup.img };
  state.messageTime = 1.0;

  if (pickup.type === "coin") {
    state.coins += 1 + (player.coinBonus || 0);
    state.message = "+ moneda";
  }

  if (pickup.type === "key") {
    state.keys += 1;
    state.message = "+ llave";
  }

  if (pickup.type === "bomb") {
    state.bombs += 1;
    state.message = "+ bomba";
  }

  if (pickup.type === "heart") {
    player.hp = Math.min(player.maxHp, player.hp + 1);
    state.message = "+ vida";
  }

  if (pickup.type === "object") {
    const item = normalizeItem(pickup.item);
    player.items.push(item);
    discoverRelic(item);
    applyObject(item);
    state.message = item.name || "+ objeto";
  }

  saveCurrentRun();
}

function applyObject(item) {
  if (applyRelicEffect(item)) {
    renderPauseDetails();
    return;
  }

  const effect = String(item?.effect || "").toLowerCase();
  if (effect.includes("daño") || effect.includes("dano")) {
    state.player.damage += effect.includes("%") ? 0.35 : 1;
  }
  if (effect.includes("velocidad")) {
    state.player.speed *= 1.1;
  }
  if (effect.includes("cadencia")) {
    state.player.fireDelay = Math.max(0.12, state.player.fireDelay * 0.9);
  }
  if (effect.includes("vida máxima") || effect.includes("vida maxima")) {
    state.player.maxHp += 1;
    state.player.hp += 1;
  }
  if (effect.includes("daño recibido") || effect.includes("dano recibido") || effect.includes("defensa")) {
    state.player.damageReduction = Math.min(0.45, (state.player.damageReduction || 0) + 0.1);
  }
  if (effect.includes("crítico") || effect.includes("critico")) {
    state.player.critChance = Math.min(0.5, (state.player.critChance || 0) + 0.08);
  }
  if (effect.includes("daño de bombas") || effect.includes("dano de bombas")) {
    state.player.bombDamage = Math.min(1, (state.player.bombDamage || 0) + 0.1);
  }
  if (effect.includes("moneda")) {
    state.player.coinBonus = Math.min(3, (state.player.coinBonus || 0) + 1);
  }
  if (effect.includes("probabilidad de llave") || effect.includes("encontrar llaves")) {
    state.player.keyLuck = Math.min(0.35, (state.player.keyLuck || 0) + 0.08);
  } else if (effect.includes("llave")) {
    state.keys += 1;
  }
  renderPauseDetails();
}

function applyRelicEffect(item) {
  const player = state.player;
  switch (item?.id) {
    case "papel-higienico":
      addMaxHp(1);
      return true;
    case "silla-gamer":
      addMaxHp(2);
      player.damageReduction = Math.min(0.55, (player.damageReduction || 0) + 0.15);
      player.speed *= 0.94;
      return true;
    case "calcetin-sucio":
      player.critChance = Math.min(0.65, (player.critChance || 0) + 0.08);
      player.dirtyAura = (player.dirtyAura || 0) + 1;
      return true;
    case "hormiga":
      player.speed *= 1.12;
      player.fireDelay = Math.max(0.1, player.fireDelay * 0.9);
      if (hasRelic("hormiguero")) player.damage += 2;
      return true;
    case "hormiguero":
      if (hasRelic("hormiga")) player.damage += 3;
      else {
        player.damage += 1;
        addMaxHp(1);
      }
      return true;
    case "tecla":
      player.fireDelay = Math.max(0.1, player.fireDelay * 0.88);
      return true;
    case "llave-porsche":
      player.speed *= 1.22;
      player.fireDelay = Math.max(0.1, player.fireDelay * 0.88);
      state.keys += 1;
      return true;
    case "cable-mordido":
      player.damage += 1;
      player.shotLifeBonus = (player.shotLifeBonus || 0) - 0.45;
      return true;
    case "lijadora":
      player.damage += 1.5;
      player.tearSizeBonus = (player.tearSizeBonus || 0) + 2;
      player.fireDelay = Math.min(0.45, player.fireDelay * 1.08);
      return true;
    case "mando":
      player.fireDelay = Math.max(0.1, player.fireDelay * 0.9);
      player.critChance = Math.min(0.65, (player.critChance || 0) + 0.08);
      return true;
    case "colacao":
      addMaxHp(1);
      player.hp = Math.min(player.maxHp, player.hp + 2);
      player.coinBonus = Math.min(4, (player.coinBonus || 0) + 1);
      return true;
    case "setup":
      player.damage += 1;
      player.fireDelay = Math.max(0.1, player.fireDelay * 0.88);
      player.critChance = Math.min(0.65, (player.critChance || 0) + 0.08);
      return true;
    case "nigiri-salmon":
      addMaxHp(1);
      player.hp = Math.min(player.maxHp, player.hp + 2);
      player.speed *= 1.08;
      return true;
    case "crep-chocolate":
      addMaxHp(1);
      player.hurtDamageBonus = (player.hurtDamageBonus || 0) + 0.12;
      return true;
    case "palillos-chinos":
      player.fireDelay = Math.max(0.1, player.fireDelay * 0.84);
      player.critChance = Math.min(0.65, (player.critChance || 0) + 0.12);
      return true;
    case "salsa-soja":
      player.fireDelay = Math.max(0.1, player.fireDelay * 0.9);
      state.keys += 1;
      return true;
    case "salsa-good-soup":
      player.damage += 2;
      player.maxHp = Math.max(1, player.maxHp - 1);
      player.hp = Math.min(player.hp, player.maxHp);
      return true;
    case "rasta-dani":
      player.damageReduction = Math.min(0.55, (player.damageReduction || 0) + 0.15);
      player.critChance = Math.min(0.65, (player.critChance || 0) + 0.15);
      return true;
    case "pegatina-perros":
      player.damage += Math.max(1, Math.floor(player.items.length / 5));
      return true;
    case "talon":
      player.damage += 2;
      player.talonEvery = 7;
      return true;
    case "perros-code":
      player.damage += 1;
      addMaxHp(1);
      player.speed *= 1.1;
      player.fireDelay = Math.max(0.1, player.fireDelay * 0.9);
      player.critChance = Math.min(0.65, (player.critChance || 0) + 0.1);
      player.keyLuck = Math.min(0.5, (player.keyLuck || 0) + 0.1);
      return true;
    default:
      return false;
  }
}

function addMaxHp(amount) {
  state.player.maxHp += amount;
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + amount);
}

function hasRelic(id) {
  return state.player.items.some((item) => item.id === id);
}

function hurtPlayer(amount = 1) {
  const player = state.player;
  if (debugState.godMode) {
    player.invuln = 0.2;
    return;
  }
  const blocked = (player.damageReduction || 0) > 0 && Math.random() < player.damageReduction;
  if (blocked) {
    player.invuln = 0.7;
    player.hitFlash = 0.18;
    state.message = "Bloqueado";
    state.messageTime = 0.55;
    return;
  }

  player.hp -= Math.max(1, Math.floor(amount));
  player.invuln = 1.05;
  player.hitFlash = 0.45;
  state.shake = 0.18;
  if (hasRelic("papel-higienico")) {
    addResourceBurst("coin", 2, player.x, player.y + 28);
  }

  if (player.hp <= 0) {
    player.dead = true;
    gameOverRun();
  } else {
    saveCurrentRun();
  }
}

function syncHud() {
  const hp = Math.max(0, state.player.hp);
  const maxHp = state.player.maxHp;
  heartsEl.innerHTML = "";

  for (let i = 0; i < maxHp; i += 1) {
    const heart = document.createElement("img");
    heart.src = i < hp ? ASSETS.heartRed : ASSETS.heartBlack;
    heart.alt = "";
    heartsEl.appendChild(heart);
  }

  coinsEl.textContent = state.coins;
  keysEl.textContent = state.keys;
  bombsEl.textContent = state.bombs;
  roomCountEl.textContent = `Sala ${state.room}`;
}

function renderPauseDetails() {
  if (!pauseStats || !pauseRelics || !state?.player) return;
  const player = state.player;
  const rows = [
    ["Sala", `${state.room}/100`],
    ["Vida", `${Math.max(0, player.hp)}/${player.maxHp}`],
    ["Daño", player.damage.toFixed(1)],
    ["Cadencia", `${(1 / player.fireDelay).toFixed(1)}/s`],
    ["Velocidad", Math.round(player.speed)],
    ["Crítico", `${Math.round((player.critChance || 0) * 100)}%`],
    ["Defensa", `${Math.round((player.damageReduction || 0) * 100)}%`],
    ["Moneda extra", `+${player.coinBonus || 0}`],
    ["Suerte llave", `${Math.round((player.keyLuck || 0) * 100)}%`],
  ];

  pauseStats.innerHTML = "";
  for (const [label, value] of rows) {
    const row = document.createElement("div");
    row.className = "stat-row";
    row.innerHTML = `<span>${label}</span><span>${value}</span>`;
    pauseStats.appendChild(row);
  }

  pauseRelics.innerHTML = "";
  if (!player.items.length) {
    const empty = document.createElement("div");
    empty.className = "empty-relics";
    empty.textContent = "Todavía no has pillado reliquias.";
    pauseRelics.appendChild(empty);
    return;
  }

  for (const item of player.items) {
    const relic = normalizeItem(item);
    const visual = relicVisual(relic);
    const cell = document.createElement("div");
    cell.className = `relic-cell relic-shape-${visual.shape}`;
    cell.tabIndex = 0;
    cell.dataset.tooltip = relicDescription(relic);
    cell.style.setProperty("--relic-color", visual.color);
    cell.style.setProperty("--rarity-color", rarityColor(relic.rarity));
    const imageSrc = relic.image ? ASSETS[relic.image] : "";
    cell.innerHTML = `<div class="relic-icon">${imageSrc ? `<img class="relic-img" src="${imageSrc}" alt="">` : `<span>${visual.mark}</span>`}</div>`;
    pauseRelics.appendChild(cell);
  }
}

function discoverRelic(item) {
  const relic = normalizeItem(item);
  if (!save.discoveredRelics.includes(relic.id)) {
    save.discoveredRelics.push(relic.id);
    writeSave();
  }
}

function renderCollection() {
  if (!collectionRelics || !collectionProgress) return;
  const discovered = new Set(save.discoveredRelics || []);
  const unlockedCount = RELIC_CATALOG.filter((item) => discovered.has(item.id)).length;
  collectionProgress.textContent = `${unlockedCount}/${RELIC_CATALOG.length} reliquias descubiertas`;
  collectionRelics.innerHTML = "";

  for (const item of RELIC_CATALOG) {
    const relic = normalizeItem(item);
    const unlocked = discovered.has(relic.id);
    const visual = relicVisual(relic);
    const cell = document.createElement("div");
    cell.className = `collection-cell relic-shape-${visual.shape} ${unlocked ? "unlocked" : "locked"}`;
    cell.style.setProperty("--relic-color", unlocked ? visual.color : "#020202");
    cell.style.setProperty("--rarity-color", rarityColor(relic.rarity));
    cell.dataset.tooltip = unlocked ? relicDescription(relic) : relic.name;
    const imageSrc = relic.image ? ASSETS[relic.image] : "";
    const icon = imageSrc
      ? `<img class="collection-img" src="${imageSrc}" alt="">`
      : `<span>${unlocked ? visual.mark : ""}</span>`;
    cell.innerHTML = `
      <div class="relic-icon">${icon}</div>
      <span class="collection-name">${relic.name}</span>
      <span class="collection-rarity">${unlocked ? relic.rarity : "???"}</span>
    `;
    collectionRelics.appendChild(cell);
  }
}

function rarityColor(rarity) {
  const text = String(rarity || "").toLowerCase();
  if (text.includes("mítica") || text.includes("mitica")) return "#ff4fd8";
  if (text.includes("legend")) return "#ffd84a";
  if (text.includes("épica") || text.includes("epica")) return "#b56dff";
  if (text.includes("rara")) return "#58a6ff";
  if (text.includes("poco")) return "#44e070";
  return "#f0dfbf";
}

function renderDebugPanel() {
  if (!debugPanel || !debugLock || !debugToolsPanel) return;
  debugPanel.hidden = !debugState.panelOpen;
  debugLock.hidden = debugState.unlocked;
  debugToolsPanel.hidden = !debugState.unlocked;

  if (debugState.unlocked) {
    renderDebugRoomOptions();
    if (debugGodMode) debugGodMode.checked = debugState.godMode;
    if (debugOneShot) debugOneShot.checked = debugState.oneShot;
  }
}

function renderDebugRoomOptions() {
  if (!debugRoomSelect || !debugGoRoomBtn || !state) return;
  const currentRoom = state.room || 1;
  const previousSelection = Number(debugRoomSelect.value || debugState.selectedRoom || currentRoom);
  const selectedRoom = clamp(
    Number.isFinite(previousSelection) ? previousSelection : currentRoom,
    currentRoom,
    100,
  );
  debugRoomSelect.innerHTML = "";

  for (let room = 1; room <= 100; room += 1) {
    const option = document.createElement("option");
    option.value = room;
    option.textContent = `Sala ${room}`;
    option.disabled = room < currentRoom;
    if (room === selectedRoom) option.selected = true;
    debugRoomSelect.appendChild(option);
  }

  debugState.selectedRoom = selectedRoom;
  debugGoRoomBtn.disabled = false;
}

function unlockDebugTools() {
  debugState.unlocked = true;
  if (debugCodeInput) debugCodeInput.value = "";
  renderDebugPanel();
}

function jumpToDebugRoom() {
  if (!state || !debugRoomSelect) return;
  const targetRoom = Number(debugRoomSelect.value);
  if (!Number.isFinite(targetRoom) || targetRoom < state.room || targetRoom > 100) return;
  if (targetRoom === state.room) {
    debugState.panelOpen = false;
    renderDebugPanel();
    setMode("game");
    return;
  }
  state.room = targetRoom;
  debugState.selectedRoom = targetRoom;
  state.player.invuln = 1.15;
  state.player.itemPose = 0;
  state.player.heldItem = null;
  spawnRoom();
  placePlayerAtEntrance(null);
  saveCurrentRun();
  setMode("game");
}

function relicDescription(item) {
  const parts = [
    item.name,
    `${item.rarity || "Reliquia"} · ${item.type || "Objeto"}`,
    item.effect || "",
    item.penalty ? String(item.penalty) : "",
  ].filter(Boolean);
  return parts.join(" | ");
}

function render() {
  ctx.save();
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  if (mode === "loading") {
    ctx.fillStyle = "#070303";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawCenteredText("Cargando...", WIDTH / 2, HEIGHT / 2, 44, "#f5dcc9");
  }

  if (mode === "menu") {
    renderMenu();
  }

  if (mode === "mainmenu") {
    renderMainMenu();
  }

  if (mode === "stats") {
    renderMainMenu();
  }

  if (mode === "game" || mode === "paused" || mode === "gameover") {
    renderGame();
  }

  ctx.restore();
}

function renderMenu() {
  drawCover(images.menuPaper, 0, 0, WIDTH, HEIGHT);

  ctx.globalAlpha = 0.98;
  drawTrimmedImage(images.title, 156, 152, 1944, 368, WIDTH / 2 - 382, 70, 764, 145);
  ctx.globalAlpha = 1;

  ctx.globalAlpha = menuPressHover ? 0.48 : 0.92 + Math.sin(performance.now() / 420) * 0.08;
  drawTrimmedImageRotated(
    images.pressStart,
    288,
    452,
    908,
    132,
    MENU_START_BOUNDS.x,
    MENU_START_BOUNDS.y,
    MENU_START_BOUNDS.w,
    MENU_START_BOUNDS.h,
    0.065,
  );
  ctx.globalAlpha = 1;
}

function renderMainMenu() {
  drawCover(images.menuBg, 0, 0, WIDTH, HEIGHT);

  ctx.save();
  ctx.translate(WIDTH / 2, 372);
  ctx.rotate(-0.055);
  ctx.translate(-WIDTH / 2, -372);

  for (const item of MAIN_MENU_ITEMS) {
    const enabled = item.enabled();
    const hovering = mainMenuHover === item.id;
    ctx.globalAlpha = enabled
      ? hovering ? 0.55 : 0.96
      : hovering ? 0.34 : 0.20;
    drawTrimmedImage(
      images[item.image],
      item.crop.x,
      item.crop.y,
      item.crop.w,
      item.crop.h,
      item.bounds.x,
      item.bounds.y,
      item.bounds.w,
      item.bounds.h,
    );
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

function renderGame() {
  if (state?.shake) {
    const amount = state.shake * 35;
    ctx.translate((Math.random() - 0.5) * amount, (Math.random() - 0.5) * amount);
  }

  drawCover(getRoomImage(state.roomProfile), 0, 0, WIDTH, HEIGHT);
  drawThemeOverlay(state.roomProfile);
  drawRoomProps(state.roomProfile);
  drawRoomDarkness();
  drawDoors(state.roomProfile);
  drawBossHealthBar();

  for (const chest of state.chests) {
    drawChest(chest);
  }

  drawShopItems();

  for (const pickup of state.pickups) {
    const y = pickup.y + Math.sin(pickup.bob) * 8;
    if (pickup.type === "object") {
      drawRelicIcon(pickup.item, pickup.x, y, 58);
    } else {
      drawImagePixel(pickup.img, pickup.x - 28, y - 28, 56, 56);
    }
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(pickup.x, pickup.y + 32, 24, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  for (const enemy of state.enemies) {
    const size = (enemy.finalBoss ? 164 : enemy.boss ? 124 : 62) + Math.sin(enemy.wobble) * (enemy.boss ? 5 : 3);
    ctx.globalAlpha = enemy.hit > 0 ? 0.65 : 1;
    const sprite = enemy.sprite ? images[enemy.sprite] : null;
    if (sprite?.complete && sprite.naturalWidth > 0) {
      drawImagePixel(sprite, enemy.x - size / 2, enemy.y - size / 2, size, size);
    } else {
      drawTintedImage(images.slime, enemy.x - size / 2, enemy.y - size / 2, size, size, enemy.tint);
    }
    ctx.globalAlpha = 1;
  }

  for (const shot of state.shots) {
    drawTear(shot.x, shot.y, "#9de8ff", "#327991", shot.r);
  }

  for (const shot of state.enemyShots) {
    drawTear(shot.x, shot.y, "#fa6868", "#651b1b", shot.r);
  }

  for (const number of state.damageNumbers) {
    drawDamageNumber(number);
  }

  if (state?.player) {
    drawPlayer();
  }

  if (state?.message && state.messageTime > 0) {
    drawCenteredText(state.message, WIDTH / 2, 96, 34, "#f7dfc9");
  }
}

function drawPlayer() {
  const player = state.player;
  let sprite = images.playerFront;

  if (player.dead) sprite = images.playerDead;
  else if (player.itemPose > 0) sprite = images.playerItem;
  else if (player.hitFlash > 0 && Math.floor(player.hitFlash * 22) % 2 === 0) sprite = images.playerHit;
  else if (player.facing === "left") sprite = images.playerLeft;
  else if (player.facing === "right") sprite = images.playerRight;

  const size = player.itemPose > 0 ? 86 : 78;
  drawImagePixel(sprite, player.x - size / 2, player.y - size / 2 - 10, size, size);

  if (player.itemPose > 0 && player.heldItem) {
    const liftProgress = 1 - Math.min(1, player.itemPose / 1.15);
    const itemSize = 44 + Math.sin(liftProgress * Math.PI) * 5;
    const itemY = player.y - 58 - Math.sin(liftProgress * Math.PI) * 4;
    if (player.heldItem.kind === "object") {
      drawRelicIcon(player.heldItem.item, player.x, itemY, itemSize);
    } else {
      drawImagePixel(player.heldItem.img, player.x - itemSize / 2, itemY - itemSize / 2, itemSize, itemSize);
    }
  }
}

function getRoomImage(profile) {
  const imageKey = profile?.theme?.roomImage || "room";
  return images[imageKey] || images.room;
}

function drawRoomDarkness() {
  const gradient = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 150, WIDTH / 2, HEIGHT / 2, 720);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(0,0,0,0.36)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawThemeOverlay(profile) {
  if (!profile) return;
  ctx.fillStyle = profile.theme.tint;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  if (profile.type === "boss") {
    ctx.fillStyle = isFinalBoss(profile) ? "rgba(55, 0, 0, 0.38)" : "rgba(25, 0, 0, 0.26)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  if (profile.type === "chestRoom" || profile.type === "woodChest" || profile.type === "silverChest" || profile.type === "goldChest" || profile.type === "madShop" || profile.type === "sacrificeRoom") {
    const glow = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 20, WIDTH / 2, HEIGHT / 2, 220);
    const goldGlow = profile.type === "goldChest" || profile.chestVariant?.type === "goldChest";
    const sacrificeGlow = profile.type === "sacrificeRoom";
    glow.addColorStop(0, sacrificeGlow ? "rgba(205, 28, 38, 0.24)" : goldGlow ? "rgba(255, 207, 76, 0.30)" : "rgba(120, 218, 255, 0.18)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
}

function drawRoomProps(profile) {
  if (!profile) return;

  if (profile.type === "jokeRoom") {
    drawFloorGraffiti("ROBERTO PAQUETE");
  }

  if (profile.type === "chestRoom" || profile.type === "woodChest" || profile.type === "silverChest" || profile.type === "goldChest") {
    drawPedestal(WIDTH / 2 - 55, HEIGHT / 2 + 20, "#9a652c", "#f5cb66");
    drawPedestal(WIDTH / 2 + 55, HEIGHT / 2 + 20, "#9a652c", "#f5cb66");
  }

  if (profile.type === "madShop") {
    drawPedestal(WIDTH / 2, HEIGHT / 2 + 28, "#446179", "#a8edff");
  }

  if (profile.type === "sacrificeRoom") {
    drawSacrificeAltar(profile);
  }

  if (profile.type === "boss") {
    ctx.strokeStyle = isFinalBoss(profile) ? "rgba(255, 215, 88, 0.38)" : "rgba(255, 58, 42, 0.26)";
    ctx.lineWidth = isFinalBoss(profile) ? 8 : 5;
    ctx.beginPath();
    ctx.ellipse(WIDTH / 2, HEIGHT / 2, isFinalBoss(profile) ? 285 : 210, isFinalBoss(profile) ? 118 : 92, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawFloorGraffiti(text) {
  ctx.save();
  ctx.translate(WIDTH / 2, HEIGHT / 2 + 88);
  ctx.rotate(-0.08);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "900 56px Arial, Helvetica, sans-serif";
  ctx.lineWidth = 10;
  ctx.globalAlpha = 0.20;
  ctx.strokeStyle = "#110605";
  ctx.strokeText(text, 0, 0);
  ctx.globalAlpha = 0.34;
  ctx.fillStyle = "#4b0d0d";
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function drawPedestal(x, y, base, top) {
  ctx.fillStyle = "rgba(0,0,0,0.32)";
  ctx.beginPath();
  ctx.ellipse(x, y + 26, 44, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = base;
  ctx.fillRect(x - 34, y - 4, 68, 36);
  ctx.fillStyle = top;
  ctx.fillRect(x - 28, y - 16, 56, 18);
  ctx.strokeStyle = "#160907";
  ctx.lineWidth = 4;
  ctx.strokeRect(x - 34, y - 4, 68, 36);
  ctx.strokeRect(x - 28, y - 16, 56, 18);
}

function drawSacrificeAltar(profile) {
  const x = WIDTH / 2;
  const y = HEIGHT / 2 - 10;
  const near = !profile.sacrificeUsed && distance(state.player, { x, y }) <= state.player.r + 62;

  ctx.save();
  const glow = ctx.createRadialGradient(x, y, 10, x, y, 170);
  glow.addColorStop(0, profile.sacrificeUsed ? "rgba(40, 40, 40, 0.22)" : "rgba(205, 25, 35, 0.30)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "rgba(0,0,0,0.38)";
  ctx.beginPath();
  ctx.ellipse(x, y + 52, 86, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = profile.sacrificeUsed ? "#3d3734" : "#5f1415";
  roundRect(x - 52, y + 2, 104, 48, 8);
  ctx.fill();
  ctx.strokeStyle = "#160706";
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.fillStyle = profile.sacrificeUsed ? "#8a8078" : "#d13b38";
  ctx.beginPath();
  ctx.moveTo(x, y - 42);
  ctx.bezierCurveTo(x - 46, y - 76, x - 78, y - 12, x, y + 28);
  ctx.bezierCurveTo(x + 78, y - 12, x + 46, y - 76, x, y - 42);
  ctx.fill();
  ctx.strokeStyle = "#160706";
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.font = "900 22px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffe5be";
  ctx.strokeStyle = "#160706";
  ctx.lineWidth = 5;
  ctx.strokeText(profile.sacrificeUsed ? "USADO" : "-1 VIDA", x, y + 76);
  ctx.fillText(profile.sacrificeUsed ? "USADO" : "-1 VIDA", x, y + 76);

  if (near) {
    ctx.fillStyle = "#f8edd3";
    ctx.strokeStyle = "#160807";
    ctx.lineWidth = 7;
    ctx.font = "900 34px Arial, Helvetica, sans-serif";
    ctx.strokeText("E", x, y - 102);
    ctx.fillText("E", x, y - 102);
  }

  ctx.restore();
}

function drawShopItems() {
  if (!state?.shopItems?.length) return;
  const nearest = nearestShopItem();

  for (const item of state.shopItems) {
    if (item.bought) continue;
    const y = item.y + Math.sin(performance.now() / 360 + item.bob) * 4;

    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.34)";
    ctx.beginPath();
    ctx.ellipse(item.x, item.y + 34, 38, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    drawPedestal(item.x, item.y + 30, "#4c2c1e", "#f0d29a");

    if (item.kind === "object" && item.item) {
      drawRelicIcon(item.item, item.x, y - 20, 54);
    } else if (item.img) {
      drawImagePixel(item.img, item.x - 28, y - 46, 56, 56);
    } else {
      ctx.fillStyle = "#111";
      roundRect(item.x - 24, y - 44, 48, 48, 6);
      ctx.fill();
      ctx.strokeStyle = "#f0d29a";
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.font = "900 34px Arial, Helvetica, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#f0d29a";
      ctx.fillText("?", item.x, y - 20);
    }

    ctx.font = "900 20px Arial, Helvetica, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#150706";
    ctx.fillStyle = "#ffe5be";
    ctx.strokeText(`${item.price}c`, item.x, item.y + 74);
    ctx.fillText(`${item.price}c`, item.x, item.y + 74);

    if (nearest === item) {
      ctx.font = "900 34px Arial, Helvetica, sans-serif";
      ctx.strokeText("E", item.x, item.y - 82);
      ctx.fillText("E", item.x, item.y - 82);
    }

    ctx.restore();
  }
}

function drawChest(chest) {
  const y = chest.y + Math.sin(chest.bob) * 3;
  const colors = {
    woodChest: { base: "#8b542d", lid: "#bd7a3d", trim: "#f0c56c" },
    silverChest: { base: "#787d87", lid: "#c8d0d8", trim: "#f4f7fb" },
    goldChest: { base: "#a76f12", lid: "#ffd35a", trim: "#fff0a5" },
  }[chest.chestType] || { base: "#8b542d", lid: "#bd7a3d", trim: "#f0c56c" };

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.34)";
  ctx.beginPath();
  ctx.ellipse(chest.x, chest.y + 36, 42, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = colors.base;
  roundRect(chest.x - 40, y - 12, 80, 48, 8);
  ctx.fill();
  ctx.strokeStyle = "#150906";
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.fillStyle = colors.lid;
  roundRect(chest.x - 43, y - 32, 86, 30, 10);
  ctx.fill();
  ctx.strokeStyle = "#150906";
  ctx.stroke();

  ctx.fillStyle = colors.trim;
  ctx.fillRect(chest.x - 6, y - 15, 12, 22);
  ctx.strokeStyle = "#150906";
  ctx.lineWidth = 3;
  ctx.strokeRect(chest.x - 6, y - 15, 12, 22);

  if (nearestClosedChest() === chest) {
    ctx.fillStyle = "#f8edd3";
    ctx.strokeStyle = "#160807";
    ctx.lineWidth = 7;
    ctx.font = "900 34px Arial, Helvetica, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeText("E", chest.x, y - 72);
    ctx.fillText("E", chest.x, y - 72);
  }

  ctx.restore();
}

function drawRelicIcon(item, x, y, size = 48) {
  const relic = normalizeItem(item);
  const visual = relicVisual(relic);
  const half = size / 2;
  const image = relic.image ? images[relic.image] : null;

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(x, y + half * 0.72, half * 0.68, half * 0.20, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(x, y);
  ctx.lineWidth = Math.max(3, size * 0.08);
  ctx.strokeStyle = rarityColor(relic.rarity);
  ctx.fillStyle = visual.color;

  if (image?.complete && image.naturalWidth > 0) {
    roundRect(-size * 0.46, -size * 0.46, size * 0.92, size * 0.92, 6);
    ctx.fillStyle = "rgba(246, 225, 194, 0.92)";
    ctx.fill();
    ctx.stroke();
    const imageSize = size * 0.78;
    drawImagePixel(image, -imageSize / 2, -imageSize / 2, imageSize, imageSize);
    ctx.restore();
    return;
  }

  if (visual.shape === "circle") {
    ctx.beginPath();
    ctx.arc(0, 0, half * 0.72, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (visual.shape === "diamond") {
    ctx.beginPath();
    ctx.moveTo(0, -half * 0.78);
    ctx.lineTo(half * 0.76, 0);
    ctx.lineTo(0, half * 0.78);
    ctx.lineTo(-half * 0.76, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (visual.shape === "triangle") {
    ctx.beginPath();
    ctx.moveTo(0, -half * 0.80);
    ctx.lineTo(half * 0.82, half * 0.62);
    ctx.lineTo(-half * 0.82, half * 0.62);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    roundRect(-half * 0.70, -half * 0.70, size * 0.70, size * 0.70, 5);
    ctx.fill();
    ctx.stroke();
  }

  ctx.globalAlpha = 0.30;
  ctx.fillStyle = "#fff6da";
  ctx.fillRect(-half * 0.34, -half * 0.48, half * 0.32, half * 0.22);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#160806";
  ctx.font = `900 ${Math.max(13, Math.floor(size * 0.36))}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(visual.mark, 0, 1);
  ctx.restore();
}

function drawDoors(profile) {
  if (!profile) return;
  for (const side of profile.doorSides) {
    const open = profile.doorsOpen;
    const sprite = getDoorSprite(profile, open);
    drawDoorSprite(side, sprite, isBossDoor(profile) ? 138 : 122);
  }

  if (profile.bombDoorSide) {
    drawDoorSprite(profile.bombDoorSide, getBombDoorSprite(profile), 122);
  }
}

function isBossDoor(profile) {
  return profile?.type === "boss" || profile?.roomNumber % 10 === 9;
}

function getDoorSprite(profile, open) {
  if (isJapanTheme(profile)) {
    if (isBossDoor(profile)) return open ? images.doorJapanBossOpen : images.doorJapanBossClosed;
    return open ? images.doorJapanOpen : images.doorJapanClosed;
  }
  if (isBossDoor(profile)) return open ? images.doorBossOpen : images.doorBossClosed;
  return open ? images.doorOpen : images.doorClosed;
}

function getBombDoorSprite(profile) {
  if (isJapanTheme(profile)) return profile.bombDoorUsed ? images.doorJapanExploded : images.doorJapanJammed;
  return profile.bombDoorUsed ? images.doorExploded : images.doorJammed;
}

function isJapanTheme(profile) {
  return profile?.theme?.name === "Japon";
}

function drawDoorSprite(side, img, size) {
  const door = DOOR_INFO[side];
  if (!door) return;
  const center = {
    top: { x: door.x + door.w / 2, y: door.y + door.h / 2 + 2, rotation: 0 },
    bottom: { x: door.x + door.w / 2, y: door.y + door.h / 2 - 2, rotation: Math.PI },
    left: { x: door.x + door.w / 2 + 2, y: door.y + door.h / 2, rotation: -Math.PI / 2 },
    right: { x: door.x + door.w / 2 - 2, y: door.y + door.h / 2, rotation: Math.PI / 2 },
  }[side];

  if (!center || !img?.complete) return;
  ctx.save();
  ctx.translate(Math.round(center.x), Math.round(center.y));
  ctx.rotate(center.rotation);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, Math.round(-size / 2), Math.round(-size / 2), Math.round(size), Math.round(size));
  ctx.restore();
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawTear(x, y, fill, stroke, r) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.9, r * 1.12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.58)";
  ctx.beginPath();
  ctx.arc(x - r * 0.25, y - r * 0.35, Math.max(2, r * 0.22), 0, Math.PI * 2);
  ctx.fill();
}

function drawDamageNumber(number) {
  const alpha = clamp(number.life / number.maxLife, 0, 1);
  const size = number.critical ? 30 : 24;
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha * 1.25);
  ctx.font = `900 ${size}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#150504";
  ctx.fillStyle = number.critical ? "#ff4a32" : "#e5241e";
  ctx.strokeText(number.value, number.x, number.y);
  ctx.fillText(number.value, number.x, number.y);
  ctx.restore();
}

function drawBossHealthBar() {
  const boss = getActiveBoss();
  if (!boss) return;

  const w = 560;
  const h = 20;
  const x = WIDTH / 2 - w / 2;
  const y = 58;
  const pct = clamp(boss.hp / boss.maxHp, 0, 1);

  ctx.save();
  ctx.fillStyle = "rgba(10, 3, 2, 0.78)";
  roundRect(x - 8, y - 25, w + 16, 60, 6);
  ctx.fill();
  ctx.strokeStyle = "#150605";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.font = "900 20px Arial, Helvetica, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#160605";
  ctx.fillStyle = "#f7dfc9";
  ctx.strokeText(boss.name, WIDTH / 2, y - 9);
  ctx.fillText(boss.name, WIDTH / 2, y - 9);

  ctx.fillStyle = "#22100c";
  ctx.fillRect(x, y + 9, w, h);
  ctx.fillStyle = boss.pattern === "nigiri" ? "#dc3c32" : boss.finalBoss ? "#f2bf39" : "#b8211f";
  ctx.fillRect(x, y + 9, w * pct, h);
  ctx.strokeStyle = "#0d0302";
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y + 9, w, h);
  ctx.restore();
}

function getActiveBoss() {
  return state?.enemies?.find((enemy) => enemy.boss) || null;
}

function drawImagePixel(img, x, y, w, h) {
  if (!img?.complete) return;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function drawTintedImage(img, x, y, w, h, tint) {
  if (tint) {
    ctx.save();
    ctx.fillStyle = tint;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h * 0.58, w * 0.5, h * 0.36, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawImagePixel(img, x, y, w, h);

  if (!tint) return;
  ctx.save();
  ctx.strokeStyle = tint;
  ctx.lineWidth = Math.max(3, w * 0.05);
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h / 2, w * 0.42, h * 0.42, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawCover(img, x, y, w, h) {
  if (!img?.complete) return;
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function drawContain(img, x, y, w, h) {
  if (!img?.complete) return;
  const scale = Math.min(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function drawTrimmedImage(img, sx, sy, sw, sh, dx, dy, dw, dh) {
  if (!img?.complete) return;
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

function drawTrimmedImageRotated(img, sx, sy, sw, sh, dx, dy, dw, dh, angle) {
  if (!img?.complete) return;
  ctx.save();
  ctx.translate(dx + dw / 2, dy + dh / 2);
  ctx.rotate(angle);
  ctx.drawImage(img, sx, sy, sw, sh, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
}

function drawCenteredText(text, x, y, size, color) {
  ctx.save();
  ctx.font = `900 ${size}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = Math.max(4, size * 0.16);
  ctx.strokeStyle = "#130807";
  ctx.fillStyle = color;
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
  ctx.restore();
}

function relicVisual(item) {
  const seed = item?.visualSeed ?? hashString(item?.name || "Reliquia");
  const colors = ["#f0c35a", "#8fd6ff", "#e66c5f", "#9be079", "#d99cff", "#f49fd1", "#b7a47c", "#eeeeaa"];
  const shapes = ["circle", "diamond", "triangle", "square"];
  return {
    color: colors[Math.abs(seed) % colors.length],
    shape: shapes[Math.abs(Math.floor(seed / 7)) % shapes.length],
    mark: String(item?.name || "?").trim().charAt(0).toUpperCase() || "?",
  };
}

function hashString(text) {
  let hash = 0;
  for (let i = 0; i < String(text).length; i += 1) {
    hash = ((hash << 5) - hash + String(text).charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getDoorExit(player) {
  const profile = state.roomProfile;
  if (!profile?.doorsOpen || player.itemPose > 0) return null;
  const sides = profile.doorSides;

  if (sides.includes("top") && player.y <= 132 && Math.abs(player.x - WIDTH / 2) < 70) return "top";
  if (sides.includes("bottom") && player.y >= HEIGHT - 116 && Math.abs(player.x - WIDTH / 2) < 70) return "bottom";
  if (sides.includes("left") && player.x <= 160 && Math.abs(player.y - HEIGHT / 2) < 70) return "left";
  if (sides.includes("right") && player.x >= WIDTH - 160 && Math.abs(player.y - HEIGHT / 2) < 70) return "right";

  if (profile.bombDoorSide && !profile.bombDoorUsed && isAtDoor(player, profile.bombDoorSide)) {
    return `bomb:${profile.bombDoorSide}`;
  }

  return null;
}

function isAtDoor(player, side) {
  if (side === "top") return player.y <= 132 && Math.abs(player.x - WIDTH / 2) < 70;
  if (side === "bottom") return player.y >= HEIGHT - 116 && Math.abs(player.x - WIDTH / 2) < 70;
  if (side === "left") return player.x <= 160 && Math.abs(player.y - HEIGHT / 2) < 70;
  if (side === "right") return player.x >= WIDTH - 160 && Math.abs(player.y - HEIGHT / 2) < 70;
  return false;
}

function openBombDoor(side) {
  if (state.bombs <= 0) {
    state.message = "Necesitas bomba";
    state.messageTime = 0.9;
    bouncePlayerFromDoor(side);
    return;
  }

  state.bombs -= 1;
  state.roomProfile.bombDoorUsed = true;
  state.message = "Puerta bomba";
  state.messageTime = 1.0;
  spawnBombDoorReward(WIDTH / 2, HEIGHT / 2 - 34);
  bouncePlayerFromDoor(side);
  saveCurrentRun();
}

function bouncePlayerFromDoor(side) {
  const player = state.player;
  if (side === "top") player.y = 166;
  if (side === "bottom") player.y = HEIGHT - 158;
  if (side === "left") player.x = 178;
  if (side === "right") player.x = WIDTH - 178;
}

function placePlayerAtEntrance(side) {
  const player = state.player;
  if (side === "top") {
    player.x = WIDTH / 2;
    player.y = 164;
    player.facing = "front";
    player.aimX = 0;
    player.aimY = 1;
    return;
  }
  if (side === "bottom") {
    player.x = WIDTH / 2;
    player.y = HEIGHT - 156;
    player.facing = "front";
    player.aimX = 0;
    player.aimY = -1;
    return;
  }
  if (side === "left") {
    player.x = 178;
    player.y = HEIGHT / 2;
    player.facing = "right";
    player.aimX = 1;
    player.aimY = 0;
    return;
  }
  if (side === "right") {
    player.x = WIDTH - 178;
    player.y = HEIGHT / 2;
    player.facing = "left";
    player.aimX = -1;
    player.aimY = 0;
    return;
  }
  player.x = WIDTH / 2;
  player.y = HEIGHT / 2;
}

function oppositeSide(side) {
  if (side === "top") return "bottom";
  if (side === "bottom") return "top";
  if (side === "left") return "right";
  if (side === "right") return "left";
  return null;
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function inBounds(x, y, pad) {
  return x > -pad && y > -pad && x < WIDTH + pad && y < HEIGHT + pad;
}

function resizeMousePosition(event) {
  const rect = canvas.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * WIDTH;
  mouse.y = ((event.clientY - rect.top) / rect.height) * HEIGHT;
  updateMenuCursor();
}

function isOverMenuStart() {
  return mouse.x >= MENU_START_BOUNDS.x
    && mouse.x <= MENU_START_BOUNDS.x + MENU_START_BOUNDS.w
    && mouse.y >= MENU_START_BOUNDS.y
    && mouse.y <= MENU_START_BOUNDS.y + MENU_START_BOUNDS.h;
}

function isPointInsideBounds(bounds, point = mouse) {
  return point.x >= bounds.x
    && point.x <= bounds.x + bounds.w
    && point.y >= bounds.y
    && point.y <= bounds.y + bounds.h;
}

function getMainMenuItemAtPointer() {
  const point = getMainMenuPointer();
  return MAIN_MENU_ITEMS.find((item) => isPointInsideBounds(item.bounds, point)) || null;
}

function updateMenuCursor() {
  menuPressHover = mode === "menu" && isOverMenuStart();
  const hoveredItem = mode === "mainmenu" ? getMainMenuItemAtPointer() : null;
  mainMenuHover = hoveredItem?.id || null;
  const canClickMainItem = Boolean(hoveredItem && hoveredItem.enabled());
  setCustomCursor(menuPressHover || canClickMainItem);
}

function getMainMenuPointer() {
  if (mode !== "mainmenu") return mouse;
  const centerX = WIDTH / 2;
  const centerY = 372;
  const angle = 0.055;
  const dx = mouse.x - centerX;
  const dy = mouse.y - centerY;
  return {
    x: centerX + dx * Math.cos(angle) - dy * Math.sin(angle),
    y: centerY + dx * Math.sin(angle) + dy * Math.cos(angle),
  };
}

function setCustomCursor(isAction) {
  document.body.classList.toggle("cursor-action", isAction);
  canvas.style.cursor = "";
}

function loop(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

function showMainMenu() {
  keys.clear();
  mouse.down = false;
  setMode("mainmenu");
}

function showStatsMenu() {
  keys.clear();
  mouse.down = false;
  setMode("stats");
}

function startFromMenu() {
  keys.clear();
  mouse.down = false;
  gameOver.hidden = true;
  victory.hidden = true;
  pauseMenu.hidden = true;
  newRun();
}

function continueFromMenu() {
  keys.clear();
  mouse.down = false;
  continueRun();
}

function pauseGame() {
  if (mode !== "game" || !state) return;
  keys.clear();
  mouse.down = false;
  saveCurrentRun();
  setMode("paused");
}

function resumeGame() {
  if (mode !== "paused") return;
  keys.clear();
  mouse.down = false;
  setMode("game");
}

function backToMainMenuFromPause() {
  if (state) saveCurrentRun();
  keys.clear();
  mouse.down = false;
  setMode("mainmenu");
}

function loadImages() {
  const entries = Object.entries(ASSETS);
  return Promise.all(entries.map(([key, src]) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      images[key] = img;
      resolve();
    };
    img.onerror = () => {
      images[key] = img;
      resolve();
    };
    img.src = src;
  })));
}

async function loadBalance() {
  try {
    const response = await fetch("assets/data/balance.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Balance ${response.status}`);
    balanceData = await response.json();
  } catch {
    balanceData = null;
  }
}

window.addEventListener("keydown", (event) => {
  if (shouldBlockBrowserShortcut(event)) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "Escape"].includes(event.code)) {
    event.preventDefault();
  }

  if (event.code === "Escape") {
    if (mode === "game") pauseGame();
    else if (mode === "paused") resumeGame();
    else if (mode === "stats") showMainMenu();
    return;
  }

  keys.add(event.code);

  if (mode === "game" && event.code === "KeyE") {
    if (tryBuyShopItem()) return;
    if (tryUseSacrifice()) return;
    tryOpenNearbyChest();
  }

  if (mode === "menu" && (event.code === "Enter" || event.code === "Space")) {
    showMainMenu();
    return;
  }

  if (mode === "mainmenu" && (event.code === "Enter" || event.code === "Space")) {
    startFromMenu();
    return;
  }

  if (mode === "gameover" && (event.code === "Enter" || event.code === "Space")) {
    startFromMenu();
    return;
  }

  if (mode === "victory" && (event.code === "Enter" || event.code === "Space")) {
    startFromMenu();
  }
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.code);
});

window.addEventListener("contextmenu", (event) => {
  if (mode === "game" || mode === "paused") event.preventDefault();
});

window.addEventListener("wheel", (event) => {
  if ((mode === "game" || mode === "paused") && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
  }
}, { passive: false });

function shouldBlockBrowserShortcut(event) {
  if (mode !== "game" && mode !== "paused") return false;
  if (event.code === "F11") return false;
  if (event.code === "F5") return true;
  if (event.code === "Backspace") return true;
  if (event.altKey && (event.code === "ArrowLeft" || event.code === "ArrowRight")) return true;
  if (!event.ctrlKey && !event.metaKey) return false;
  return [
    "KeyA",
    "KeyD",
    "KeyF",
    "KeyL",
    "KeyN",
    "KeyO",
    "KeyP",
    "KeyR",
    "KeyS",
    "KeyT",
    "KeyW",
    "Equal",
    "Minus",
    "Digit0",
  ].includes(event.code);
}

canvas.addEventListener("pointerdown", (event) => {
  resizeMousePosition(event);
  mouse.down = true;
  canvas.setPointerCapture(event.pointerId);

  if (mode === "menu" && isOverMenuStart()) {
    showMainMenu();
    return;
  }

  if (mode === "mainmenu") {
    const item = getMainMenuItemAtPointer();
    if (item?.enabled()) {
      if (item.id === "newRun") startFromMenu();
      if (item.id === "continue") continueFromMenu();
      if (item.id === "stats") showStatsMenu();
    }
  }
});

canvas.addEventListener("pointermove", resizeMousePosition);
canvas.addEventListener("pointerleave", () => {
  mouse.down = false;
  menuPressHover = false;
  mainMenuHover = null;
  setCustomCursor(false);
});

canvas.addEventListener("pointerup", (event) => {
  mouse.down = false;
  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
});

retryBtn.addEventListener("click", () => startFromMenu());
victoryBtn.addEventListener("click", () => startFromMenu());
statsBackBtn?.addEventListener("click", () => showMainMenu());
resumeBtn.addEventListener("click", () => resumeGame());
pauseMenuBtn.addEventListener("click", () => backToMainMenuFromPause());
pauseNewRunBtn.addEventListener("click", () => startFromMenu());

secretToolBtn?.addEventListener("click", () => {
  debugState.panelOpen = !debugState.panelOpen;
  renderDebugPanel();
  if (debugState.panelOpen && !debugState.unlocked) {
    debugCodeInput?.focus();
  }
});

debugCodeInput?.addEventListener("input", () => {
  debugCodeInput.value = debugCodeInput.value.replace(/\D/g, "").slice(0, 4);
  if (debugCodeInput.value === "2201") unlockDebugTools();
});

debugCodeInput?.addEventListener("keydown", (event) => {
  if (event.code === "Enter" && debugCodeInput.value === "2201") unlockDebugTools();
});

debugGoRoomBtn?.addEventListener("click", () => jumpToDebugRoom());
debugRoomSelect?.addEventListener("change", () => {
  debugState.selectedRoom = Number(debugRoomSelect.value) || debugState.selectedRoom;
});
debugCloseBtn?.addEventListener("click", () => {
  debugState.panelOpen = false;
  renderDebugPanel();
});
debugGodMode?.addEventListener("change", () => {
  debugState.godMode = debugGodMode.checked;
  renderDebugPanel();
});
debugOneShot?.addEventListener("change", () => {
  debugState.oneShot = debugOneShot.checked;
  renderDebugPanel();
});

Promise.all([loadImages(), loadBalance()]).then(() => {
  setMode("menu");
  requestAnimationFrame(loop);
});
