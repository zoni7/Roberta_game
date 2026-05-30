
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
  SFX.merchantBuy();
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
        if (enemy.hp <= 0 && !enemy._deathSoundPlayed) {
          SFX.enemyDeath(state.roomProfile?.theme?.name ?? null);
          enemy._deathSoundPlayed = true;
        }
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
