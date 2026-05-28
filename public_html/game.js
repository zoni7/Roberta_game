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
};

const ROOM_THEMES = [
  { name: "Carne", tint: "rgba(78, 8, 8, 0.18)", glow: "rgba(195, 45, 38, 0.22)" },
  { name: "Sotano", tint: "rgba(68, 55, 42, 0.20)", glow: "rgba(196, 155, 96, 0.18)" },
  { name: "Moho", tint: "rgba(20, 74, 49, 0.18)", glow: "rgba(62, 173, 107, 0.16)" },
  { name: "Hielo", tint: "rgba(32, 72, 94, 0.18)", glow: "rgba(92, 198, 224, 0.18)" },
  { name: "Dorado", tint: "rgba(126, 92, 16, 0.16)", glow: "rgba(255, 204, 84, 0.20)" },
];

const ROOM_TYPE_NAMES = {
  fightBasic: "Pelea",
  fightElite: "Elite",
  woodChest: "Madera",
  silverChest: "Plata",
  goldChest: "Dorado",
  madShop: "Mercader",
  riskEvent: "Riesgo",
  boss: "Boss",
};

const ROOM_TYPE_TABLE = [
  { value: "fightBasic", weight: 58 },
  { value: "fightElite", weight: 14 },
  { value: "woodChest", weight: 12 },
  { value: "silverChest", weight: 10 },
  { value: "riskEvent", weight: 6 },
];

const DOOR_SIDES = ["top", "right", "bottom", "left"];
const DOOR_INFO = {
  top: { x: WIDTH / 2 - 56, y: 88, w: 112, h: 56 },
  right: { x: WIDTH - 130, y: HEIGHT / 2 - 56, w: 58, h: 112 },
  bottom: { x: WIDTH / 2 - 56, y: HEIGHT - 116, w: 112, h: 56 },
  left: { x: 72, y: HEIGHT / 2 - 56, w: 58, h: 112 },
};

const ENEMY_CATALOG = {
  Carne: [
    { name: "Grumo", tier: 1, tint: "rgba(180, 35, 35, 0.28)", rScale: 1, hpScale: 1, speedScale: 1, canShoot: false },
    { name: "Vena", tier: 2, tint: "rgba(120, 0, 0, 0.38)", rScale: 0.9, hpScale: 0.85, speedScale: 1.25, canShoot: false },
    { name: "Ojo carnoso", tier: 3, tint: "rgba(255, 78, 78, 0.32)", rScale: 1.12, hpScale: 1.25, speedScale: 0.9, canShoot: true },
  ],
  Sotano: [
    { name: "Polvo", tier: 1, tint: "rgba(145, 112, 72, 0.30)", rScale: 1, hpScale: 1, speedScale: 0.95, canShoot: false },
    { name: "Rata rota", tier: 2, tint: "rgba(92, 78, 61, 0.36)", rScale: 0.85, hpScale: 0.9, speedScale: 1.35, canShoot: false },
    { name: "Moho seco", tier: 3, tint: "rgba(202, 166, 98, 0.30)", rScale: 1.18, hpScale: 1.35, speedScale: 0.82, canShoot: true },
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

const MENU_START_BOUNDS = { x: WIDTH / 2 - 222, y: 502, w: 444, h: 72 };
const MAIN_MENU_ITEMS = [
  { id: "newRun", image: "newRun", crop: { x: 340, y: 450, w: 787, h: 155 }, bounds: { x: WIDTH / 2 - 190, y: 288, w: 380, h: 75 }, enabled: () => true },
  { id: "continue", image: "continue", crop: { x: 372, y: 450, w: 741, h: 157 }, bounds: { x: WIDTH / 2 - 180, y: 376, w: 360, h: 76 }, enabled: () => hasCurrentRun() },
  { id: "stats", image: "stats", crop: { x: 462, y: 452, w: 563, h: 129 }, bounds: { x: WIDTH / 2 - 138, y: 465, w: 276, h: 64 }, enabled: () => false },
  { id: "options", image: "options", crop: { x: 360, y: 454, w: 789, h: 147 }, bounds: { x: WIDTH / 2 - 190, y: 546, w: 380, h: 71 }, enabled: () => false },
];
let menuPressHover = false;
let mainMenuHover = null;

let lastTime = performance.now();
let mode = "loading";
let save = loadSave();
let state = null;
let balanceData = null;

window.__perrosDebug = () => ({
  mode,
  hasCurrentRun: hasCurrentRun(),
  room: state?.room ?? 0,
  roomType: state?.roomProfile?.type ?? "none",
  doorSides: state?.roomProfile?.doorSides ?? [],
  bombDoorSide: state?.roomProfile?.bombDoorSide ?? null,
  theme: state?.roomProfile?.theme?.name ?? "",
  hp: state?.player?.hp ?? 0,
  facing: state?.player?.facing ?? "front",
  aimX: state?.player?.aimX ?? 0,
  aimY: state?.player?.aimY ?? 1,
  enemies: state?.enemies?.length ?? 0,
  pickups: state?.pickups?.length ?? 0,
  coins: state?.coins ?? 0,
  keys: state?.keys ?? 0,
  bombs: state?.bombs ?? 0,
});

function loadSave() {
  try {
    return {
      bestRoom: 0,
      totalCoins: 0,
      totalKeys: 0,
      totalBombs: 0,
      unlockedBlackHeart: false,
      currentRun: null,
      ...JSON.parse(localStorage.getItem(SAVE_KEY) || "{}"),
    };
  } catch {
    return { bestRoom: 0, totalCoins: 0, totalKeys: 0, totalBombs: 0, unlockedBlackHeart: false, currentRun: null };
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
    },
    enemies: [],
    shots: [],
    enemyShots: [],
    pickups: [],
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
  hud.hidden = mode !== "game";
  gameOver.hidden = mode !== "gameover";
  victory.hidden = mode !== "victory";
  updateMenuCursor();
}

function getBalanceRow(listName, roomNumber) {
  return balanceData?.[listName]?.find((row) => row.room === Math.min(roomNumber, 100)) || null;
}

function rollRoomType(roomNumber) {
  const row = getBalanceRow("roomTypes", roomNumber);
  if (row?.weights) {
    return weightedChoiceFromObject(row.weights);
  }
  const isBoss = roomNumber % 10 === 0;
  return isBoss ? "boss" : weightedChoice(ROOM_TYPE_TABLE);
}

function createRoomProfile(roomNumber, entrySide) {
  const theme = ROOM_THEMES[Math.floor((roomNumber - 1) / 10) % ROOM_THEMES.length];
  const doorRow = getBalanceRow("doors", roomNumber);
  const type = rollRoomType(roomNumber);
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
  };
}

function getDoorCount(type, doorRow = null) {
  if (doorRow?.doorWeights) {
    return Number(weightedChoiceFromObject(doorRow.doorWeights));
  }
  if (type === "boss") return 1;
  return weightedChoice([{ value: 1, weight: 12 }, { value: 2, weight: 38 }, { value: 3, weight: 32 }, { value: 4, weight: 18 }]);
}

function pickBombDoorSide(type, doorSides, doorRow) {
  if (!doorRow || !isFightRoom(type) || doorRow.bombDoorChance <= 0) return null;
  if (Math.random() * 100 > doorRow.bombDoorChance) return null;
  const available = DOOR_SIDES.filter((side) => !doorSides.includes(side));
  if (!available.length) return null;
  return available[Math.floor(Math.random() * available.length)];
}

function isFightRoom(type) {
  return type === "fightBasic" || type === "fightElite";
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
  if (profile.type === "fightElite") return Math.min(2 + Math.floor(state.room / 4), 9);
  if (profile.type === "riskEvent") return Math.min(2 + Math.floor(state.room / 5), 8);
  return Math.min(1 + Math.floor(state.room / 2), 7);
}

function getEnemySpeed(profile) {
  const base = profile.type === "fightElite" || profile.type === "riskEvent" ? 64 : 52;
  return base + state.room * 7;
}

function isFinalBoss(profile) {
  return profile?.type === "boss" && profile.roomNumber >= 100;
}

function spawnRoomReward(profile) {
  if (profile.type === "fightBasic" || profile.type === "fightElite") {
    spawnFightLoot(profile.type, state.room, WIDTH / 2, HEIGHT / 2 - 34);
    return;
  }

  if (profile.type === "boss") {
    addPickup("heart", images.heartRed, WIDTH / 2 - 34, HEIGHT / 2 - 34);
    addPickup("object", images.key, WIDTH / 2 + 34, HEIGHT / 2 - 34, chooseObject());
    return;
  }

  if (profile.type === "woodChest" || profile.type === "silverChest" || profile.type === "goldChest") {
    spawnChestLoot(profile.type, WIDTH / 2, HEIGHT / 2 - 34);
    return;
  }

  if (profile.type === "madShop") {
    addPickup("coin", images.coin, WIDTH / 2 - 38, HEIGHT / 2 - 34);
    addPickup("key", images.key, WIDTH / 2 + 38, HEIGHT / 2 - 34);
    return;
  }

  if (profile.type === "riskEvent") {
    addPickup("heart", images.heartRed, WIDTH / 2, HEIGHT / 2 - 34);
    return;
  }
}

function spawnFightLoot(fightType, roomNumber, x, y) {
  const loot = getFightLootRow(fightType, roomNumber);
  if (!loot) {
    if (Math.random() < 0.72) addPickup("coin", images.coin, x, y);
    return;
  }

  const reward = weightedChoiceFromObject(loot.weights);
  if (reward === "nothing") return;
  if (reward === "coins") {
    const amount = randomInt(loot.coinQuantity?.[0] || 1, loot.coinQuantity?.[1] || 1);
    addResourceBurst("coin", amount, x, y);
    return;
  }
  if (reward === "woodChest" || reward === "silverChest") {
    spawnChestLoot(reward, x, y);
    return;
  }
  addPickup(reward, null, x, y);
}

function getFightLootRow(fightType, roomNumber) {
  return balanceData?.fightLoot?.find((row) => (
    row.fightType === fightType && roomNumber >= row.range[0] && roomNumber <= row.range[1]
  )) || null;
}

function spawnChestLoot(chestType, x, y) {
  const chestName = chestType === "goldChest" ? "dorado" : chestType === "silverChest" ? "plata" : "madera";
  const options = balanceData?.chestLoot
    ?.filter((row) => String(row.chest).includes(chestName))
    ?.map((row) => ({ value: row.reward, weight: row.probability })) || [];
  const reward = options.length ? weightedChoice(options) : "Monedas";
  spawnRewardByName(reward, x, y);
}

function spawnBombDoorReward(x, y) {
  const options = balanceData?.bombDoorLoot?.map((row) => ({ value: row.reward, weight: row.probability })) || [];
  const reward = options.length ? weightedChoice(options) : "Monedas";
  spawnRewardByName(reward, x, y);
}

function spawnRewardByName(rewardName, x, y) {
  const text = String(rewardName).toLowerCase();
  if (text.includes("moneda")) {
    addResourceBurst("coin", randomInt(2, 6), x, y);
  } else if (text.includes("llave")) {
    addResourceBurst("key", text.includes("x2") ? 2 : 1, x, y);
  } else if (text.includes("bomba")) {
    addResourceBurst("bomb", text.includes("x2") ? 2 : 1, x, y);
  } else if (text.includes("corazón") || text.includes("curación")) {
    addResourceBurst("heart", 1, x, y);
  } else if (text.includes("objeto") || text.includes("reliquia")) {
    addPickup("object", images.key, x, y, chooseObject());
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

function chooseObject() {
  if (!balanceData?.objects?.length) return { name: "Reliquia", effect: "+ poder" };
  const pool = balanceData.objects.filter((item) => {
    const rarity = String(item.rarity || "").toLowerCase();
    if (state.room < 20) return rarity.includes("común") || rarity.includes("comun");
    if (state.room < 60) return !rarity.includes("legend");
    return true;
  });
  return pool[Math.floor(Math.random() * pool.length)] || balanceData.objects[0];
}

function addPickup(type, img, x, y, item = null) {
  const image = img || pickupImage(type);
  state.pickups.push({ type, img: image, x, y, r: 26, bob: 0, item });
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
  state.pickups = [];
  state.cleared = false;
  state.message = "";
  state.roomProfile = createRoomProfile(state.room, entrySide);

  const profile = state.roomProfile;
  const count = getEnemyCount(profile);
  for (let i = 0; i < count; i += 1) {
    const edge = i % 4;
    const x = edge === 0 ? 230 : edge === 1 ? WIDTH - 230 : 260 + Math.random() * (WIDTH - 520);
    const y = edge === 2 ? 175 : edge === 3 ? HEIGHT - 150 : 170 + Math.random() * (HEIGHT - 320);
    const isBoss = profile.type === "boss";
    const isFinal = isFinalBoss(profile);
    const archetype = selectEnemyArchetype(profile, i);
    const hp = isFinal ? 260 : isBoss ? 16 + Math.floor(state.room / 3) : (2 + Math.floor(state.room / 2)) * archetype.hpScale;
    const speed = isFinal ? 82 : isBoss ? 42 + Math.floor(state.room / 5) : getEnemySpeed(profile) * archetype.speedScale;
    state.enemies.push({
      x,
      y,
      r: (isFinal ? 62 : isBoss ? 46 : 23) * archetype.rScale,
      hp,
      maxHp: hp,
      speed,
      wobble: Math.random() * 10,
      shoot: isFinal ? 0.45 : isBoss || archetype.canShoot ? 0.9 + Math.random() * 0.7 : 99,
      hit: 0,
      boss: isBoss,
      finalBoss: isFinal,
      name: isBoss ? `Boss ${profile.theme.name}` : archetype.name,
      tint: isBoss ? profile.theme.glow : archetype.tint,
      canShoot: isBoss || archetype.canShoot,
    });
  }
}

function selectEnemyArchetype(profile, index) {
  if (profile.type === "boss") {
    return { name: "Boss", tier: 3, tint: profile.theme.glow, rScale: 1, hpScale: 1, speedScale: 1, canShoot: true };
  }

  const tier = enemyTierForRoom(state.room);
  const themeList = ENEMY_CATALOG[profile.theme.name] || ENEMY_CATALOG.Carne;
  const available = themeList.filter((enemy) => enemy.tier <= tier + (profile.type === "fightElite" ? 1 : 0));
  const pool = available.length ? available : themeList;
  return pool[(index + Math.floor(Math.random() * pool.length)) % pool.length];
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

  state.message = state.roomProfile.type === "boss" ? "Boss derrotado" : "Sala limpia";
  state.messageTime = 1.2;
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
  updateEnemies(dt);
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

  player.x = clamp(player.x, 155, WIDTH - 155);
  player.y = clamp(player.y, 125, HEIGHT - 105);

  if (mx || my) {
    player.aimX = mx / mag;
    player.aimY = my / mag;
  }

  if (mx < 0) {
    player.facing = mx < 0 ? "left" : "right";
  } else if (mx > 0) {
    player.facing = "right";
  } else if (my !== 0) {
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
    r: 8,
    life: 0.85,
    damage: player.damage,
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
        enemy.hp -= shot.damage;
        enemy.hit = 0.15;
        shot.life = 0;
        state.shake = 0.05;
      }
    }
  }

  const player = state.player;
  for (const shot of state.enemyShots) {
    if (shot.life > 0 && player.invuln <= 0 && distance(player, shot) < player.r + shot.r) {
      hurtPlayer();
      shot.life = 0;
    }
  }

  state.enemies = state.enemies.filter((enemy) => enemy.hp > 0);
  state.shots = state.shots.filter((shot) => shot.life > 0 && inBounds(shot.x, shot.y, 80));
  state.enemyShots = state.enemyShots.filter((shot) => shot.life > 0 && inBounds(shot.x, shot.y, 90));
}

function updateEnemies(dt) {
  const player = state.player;

  for (const enemy of state.enemies) {
    enemy.wobble += dt * 8;
    enemy.shoot -= dt;

    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const mag = Math.hypot(dx, dy) || 1;

    enemy.x += (dx / mag) * enemy.speed * dt;
    enemy.y += (dy / mag) * enemy.speed * dt;
    enemy.x += Math.sin(enemy.wobble) * 12 * dt;
    enemy.y += Math.cos(enemy.wobble * 0.7) * 10 * dt;
    enemy.x = clamp(enemy.x, 150, WIDTH - 150);
    enemy.y = clamp(enemy.y, 125, HEIGHT - 100);

    if (distance(player, enemy) < player.r + enemy.r && player.invuln <= 0) {
      hurtPlayer();
    }

    if (enemy.canShoot && enemy.shoot <= 0 && state.room >= 2) {
      enemy.shoot = enemy.finalBoss ? 0.5 + Math.random() * 0.25 : enemy.boss ? 0.95 + Math.random() * 0.55 : 1.7 + Math.random() * 1.2;
      const shotSpeed = enemy.finalBoss ? 360 : enemy.boss ? 300 : 260;
      const vx = (dx / mag) * shotSpeed;
      const vy = (dy / mag) * shotSpeed;
      state.enemyShots.push({ x: enemy.x, y: enemy.y, vx, vy, r: enemy.finalBoss ? 9 : 7, life: 2 });

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
          });
        }
      }
    }
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

function collectPickup(pickup) {
  const player = state.player;
  player.itemPose = 1.15;
  player.heldItem = pickup.img;
  state.messageTime = 1.0;

  if (pickup.type === "coin") {
    state.coins += 1;
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
    applyObject(pickup.item);
    state.message = pickup.item?.name || "+ objeto";
  }

  saveCurrentRun();
}

function applyObject(item) {
  const effect = String(item?.effect || "").toLowerCase();
  if (effect.includes("daño") || effect.includes("dano")) {
    state.player.damage += effect.includes("15%") ? 0.35 : 1;
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
  if (effect.includes("moneda")) {
    state.coins += 1;
  }
  if (effect.includes("llave")) {
    state.keys += 1;
  }
}

function hurtPlayer() {
  const player = state.player;
  player.hp -= 1;
  player.invuln = 1.05;
  player.hitFlash = 0.45;
  state.shake = 0.18;

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
  const roomName = ROOM_TYPE_NAMES[state.roomProfile?.type] || "Sala";
  roomCountEl.textContent = `${roomName} ${state.room}`;
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

  if (mode === "game" || mode === "gameover") {
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
  drawTrimmedImage(
    images.pressStart,
    288,
    452,
    908,
    132,
    MENU_START_BOUNDS.x,
    MENU_START_BOUNDS.y,
    MENU_START_BOUNDS.w,
    MENU_START_BOUNDS.h,
  );
  ctx.globalAlpha = 1;
}

function renderMainMenu() {
  drawCover(images.menuBg, 0, 0, WIDTH, HEIGHT);

  ctx.globalAlpha = 0.95;
  drawTrimmedImage(images.title, 156, 152, 1944, 368, WIDTH / 2 - 320, 84, 640, 122);
  ctx.globalAlpha = 1;

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
}

function renderGame() {
  if (state?.shake) {
    const amount = state.shake * 35;
    ctx.translate((Math.random() - 0.5) * amount, (Math.random() - 0.5) * amount);
  }

  drawCover(images.room, 0, 0, WIDTH, HEIGHT);
  drawThemeOverlay(state.roomProfile);
  drawRoomProps(state.roomProfile);
  drawRoomDarkness();
  drawDoors(state.roomProfile);

  for (const pickup of state.pickups) {
    const y = pickup.y + Math.sin(pickup.bob) * 8;
    drawImagePixel(pickup.img, pickup.x - 28, y - 28, 56, 56);
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
    drawTintedImage(images.slime, enemy.x - size / 2, enemy.y - size / 2, size, size, enemy.tint);
    ctx.globalAlpha = 1;
  }

  for (const shot of state.shots) {
    drawTear(shot.x, shot.y, "#9de8ff", "#327991", shot.r);
  }

  for (const shot of state.enemyShots) {
    drawTear(shot.x, shot.y, "#fa6868", "#651b1b", shot.r);
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
    const itemY = player.y - 76 - Math.sin(liftProgress * Math.PI) * 6;
    drawImagePixel(player.heldItem, player.x - itemSize / 2, itemY - itemSize / 2, itemSize, itemSize);
  }
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

  if (profile.type === "woodChest" || profile.type === "silverChest" || profile.type === "goldChest" || profile.type === "madShop") {
    const glow = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 20, WIDTH / 2, HEIGHT / 2, 220);
    glow.addColorStop(0, profile.type === "goldChest" ? "rgba(255, 207, 76, 0.30)" : "rgba(120, 218, 255, 0.18)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
}

function drawRoomProps(profile) {
  if (!profile) return;

  if (profile.type === "woodChest" || profile.type === "silverChest" || profile.type === "goldChest") {
    drawPedestal(WIDTH / 2 - 55, HEIGHT / 2 + 20, "#9a652c", "#f5cb66");
    drawPedestal(WIDTH / 2 + 55, HEIGHT / 2 + 20, "#9a652c", "#f5cb66");
  }

  if (profile.type === "madShop") {
    drawPedestal(WIDTH / 2, HEIGHT / 2 + 28, "#446179", "#a8edff");
  }

  if (profile.type === "boss") {
    ctx.strokeStyle = isFinalBoss(profile) ? "rgba(255, 215, 88, 0.38)" : "rgba(255, 58, 42, 0.26)";
    ctx.lineWidth = isFinalBoss(profile) ? 8 : 5;
    ctx.beginPath();
    ctx.ellipse(WIDTH / 2, HEIGHT / 2, isFinalBoss(profile) ? 285 : 210, isFinalBoss(profile) ? 118 : 92, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
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

function drawDoors(profile) {
  if (!profile) return;
  for (const side of profile.doorSides) {
    const door = DOOR_INFO[side];
    const open = profile.doorsOpen;

    ctx.save();
    ctx.fillStyle = open ? "rgba(8, 4, 3, 0.92)" : "rgba(39, 11, 9, 0.92)";
    ctx.strokeStyle = open ? "rgba(238, 198, 128, 0.92)" : "rgba(77, 37, 31, 0.92)";
    ctx.lineWidth = 5;
    roundRect(door.x, door.y, door.w, door.h, 10);
    ctx.fill();
    ctx.stroke();

    if (!open) {
      ctx.strokeStyle = "rgba(14, 7, 6, 0.95)";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(door.x + 14, door.y + 14);
      ctx.lineTo(door.x + door.w - 14, door.y + door.h - 14);
      ctx.moveTo(door.x + door.w - 14, door.y + 14);
      ctx.lineTo(door.x + 14, door.y + door.h - 14);
      ctx.stroke();
    }

    ctx.restore();
  }

  if (profile.bombDoorSide && !profile.bombDoorUsed) {
    const door = DOOR_INFO[profile.bombDoorSide];
    ctx.save();
    ctx.fillStyle = profile.doorsOpen ? "rgba(20, 20, 23, 0.94)" : "rgba(21, 10, 10, 0.80)";
    ctx.strokeStyle = "rgba(230, 230, 210, 0.88)";
    ctx.lineWidth = 4;
    roundRect(door.x, door.y, door.w, door.h, 10);
    ctx.fill();
    ctx.stroke();
    drawImagePixel(images.bomb, door.x + door.w / 2 - 19, door.y + door.h / 2 - 19, 38, 38);
    ctx.restore();
  }
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

function isPointInsideBounds(bounds) {
  return mouse.x >= bounds.x
    && mouse.x <= bounds.x + bounds.w
    && mouse.y >= bounds.y
    && mouse.y <= bounds.y + bounds.h;
}

function getMainMenuItemAtPointer() {
  return MAIN_MENU_ITEMS.find((item) => isPointInsideBounds(item.bounds)) || null;
}

function updateMenuCursor() {
  menuPressHover = mode === "menu" && isOverMenuStart();
  const hoveredItem = mode === "mainmenu" ? getMainMenuItemAtPointer() : null;
  mainMenuHover = hoveredItem?.id || null;
  const canClickMainItem = Boolean(hoveredItem && hoveredItem.enabled());
  canvas.style.cursor = menuPressHover || canClickMainItem ? "pointer" : "default";
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

function startFromMenu() {
  keys.clear();
  mouse.down = false;
  gameOver.hidden = true;
  victory.hidden = true;
  newRun();
}

function continueFromMenu() {
  keys.clear();
  mouse.down = false;
  continueRun();
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
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
    event.preventDefault();
  }

  keys.add(event.code);

  if (mode === "menu" && (event.code === "Enter" || event.code === "Space")) {
    showMainMenu();
  }

  if (mode === "mainmenu" && (event.code === "Enter" || event.code === "Space")) {
    startFromMenu();
  }

  if (mode === "gameover" && (event.code === "Enter" || event.code === "Space")) {
    startFromMenu();
  }

  if (mode === "victory" && (event.code === "Enter" || event.code === "Space")) {
    startFromMenu();
  }
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.code);
});

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
    }
  }
});

canvas.addEventListener("pointermove", resizeMousePosition);
canvas.addEventListener("pointerleave", () => {
  mouse.down = false;
  menuPressHover = false;
  mainMenuHover = null;
  canvas.style.cursor = "default";
});

canvas.addEventListener("pointerup", (event) => {
  mouse.down = false;
  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
});

retryBtn.addEventListener("click", () => startFromMenu());
victoryBtn.addEventListener("click", () => startFromMenu());

Promise.all([loadImages(), loadBalance()]).then(() => {
  setMode("menu");
  requestAnimationFrame(loop);
});
