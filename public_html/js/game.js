
function setMode(nextMode) {
  mode = nextMode;
  hud.hidden = mode !== "game" && mode !== "paused";
  gameOver.hidden = mode !== "gameover";
  victory.hidden = mode !== "victory";
  statsMenu.hidden = mode !== "stats";
  if (optionsMenu) optionsMenu.hidden = mode !== "options";
  pauseMenu.hidden = mode !== "paused";
  if (merchantMenu) merchantMenu.hidden = !merchantMenuOpen;
  if (healerMenu) healerMenu.hidden = !healerMenuOpen;
  if (upgradeMenu) upgradeMenu.hidden = !upgradeMenuOpen;
  if (mode === "stats") renderCollection();
  if (mode === "options") renderOptions();
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
  if (HEALER_ROOM_CHANCES[roomNumber] && Math.random() < HEALER_ROOM_CHANCES[roomNumber]) return "healerRoom";
  if (roomNumber === 33 && !(state?.chestRoomHistory || []).some((room) => room <= 30)) return "chestRoom";
  if (roomNumber === 21) {
    return weightedChoiceFromObject({ fightBasic: 10, fightMixed: 3, madShop: ROOM_21_MERCHANT_CHANCE * 100, riskEvent: 2 });
  }
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
  const visibleChance = Math.min(24, doorRow.bombDoorChance * 2.15);
  if (Math.random() * 100 > visibleChance) return null;
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
  if (isFinalBoss(profile) || profile.theme.name === "Cuarto de Roberto") {
    return { name: "Roberto", tier: 3, tint: "rgba(138, 158, 206, 0.38)", rScale: 1.22, hpScale: 2.35, speedScale: 0.82, canShoot: true, pattern: "final" };
  }
  if (profile.theme.name === "Japon") {
    return { name: "Adri", tier: 3, tint: "rgba(225, 78, 64, 0.34)", rScale: 1.1, hpScale: 1.28, speedScale: 0.72, canShoot: false, pattern: "nigiri", sprite: "bossAdri" };
  }
  if (profile.theme.name === "Isaac") {
    return { name: "Alex", tier: 3, tint: "rgba(178, 84, 92, 0.28)", rScale: 1.28, hpScale: 4.6, speedScale: 0.72, canShoot: false, pattern: "alex", sprite: "bossAlexPout" };
  }
  if (profile.theme.name === "Iglesia") {
    return { name: "Victor", tier: 3, tint: "rgba(246, 214, 138, 0.24)", rScale: 1.22, hpScale: 2.15, speedScale: 0.74, canShoot: false, pattern: "victor", sprite: "bossVictor" };
  }
  if (profile.theme.name === "Minecraft") {
    return { name: "Samu", tier: 3, tint: "rgba(88, 205, 96, 0.34)", rScale: 1.3, hpScale: 2.5, speedScale: 0.72, canShoot: false, pattern: "samu", sprite: "bossSamu" };
  }
  if (profile.theme.name === "Discoteca") {
    return { name: "Jajo", tier: 3, tint: "rgba(255, 80, 187, 0.34)", rScale: 1.28, hpScale: 2.35, speedScale: 0.78, canShoot: false, pattern: "jajo", sprite: "bossJajo" };
  }
  if (profile.theme.name === "Rastas") {
    return { name: "Dani", tier: 3, tint: "rgba(171, 202, 68, 0.36)", rScale: 1.2, hpScale: 1.92, speedScale: 0.9, canShoot: true, pattern: "spread" };
  }
  if (profile.theme.name === "Taller") {
    return { name: "Cabina de pintura", tier: 3, tint: "rgba(84, 184, 218, 0.36)", rScale: 1.24, hpScale: 2.02, speedScale: 0.78, canShoot: true, pattern: "spread" };
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

  if (profile.type === "healerRoom") return;

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
  const offers = [];
  const offeredRelicIds = new Set();
  const shopPool = ["goldChest", "boss", profile.theme.name === "Japon" ? "bossJapan" : "fight"];
  for (let index = 0; index < 4; index += 1) {
    let relic = null;
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const candidate = chooseObject(shopPool[(index + attempt) % shopPool.length]);
      if (candidate && !offeredRelicIds.has(candidate.id)) {
        relic = candidate;
        break;
      }
    }
    if (!relic) break;
    offeredRelicIds.add(relic.id);
    offers.push({ kind: "object", label: relic.name, price: relicShopPrice(relic) + roomBoost, img: null, item: relic });
  }
  if (!offers.length) {
    offers.push(
      { kind: "key", label: "Llave", price: 4 + roomBoost, img: images.key },
      { kind: "bomb", label: "Bomba", price: 4 + roomBoost, img: images.bomb },
      { kind: "heart", label: "Vida", price: 3 + roomBoost, img: images.heartRed },
    );
  }
  if (Math.random() < 0.24) offers.push({ kind: "nothing", label: "Nada", price: 2 + Math.floor(roomBoost / 2), img: null });

  state.shopItems = offers.map((offer) => ({
    ...offer,
    x: WIDTH / 2,
    y: HEIGHT / 2,
    r: 42,
    bought: false,
    bob: Math.random() * Math.PI * 2,
  }));
}

function relicShopPrice(relic) {
  const rarity = String(relic?.rarity || "").toLowerCase();
  if (rarity.includes("mÃ­tica") || rarity.includes("mitica")) return 22;
  if (rarity.includes("legend")) return 18;
  if (rarity.includes("Ã©pica") || rarity.includes("epica")) return 15;
  if (rarity.includes("rara")) return 12;
  if (rarity.includes("poco")) return 10;
  return 8;
}

function nearMerchant() {
  return state?.roomProfile?.type === "madShop" && distance(state.player, { x: WIDTH / 2, y: HEIGHT / 2 - 24 }) <= 132;
}

function openMerchantMenu() {
  if (!nearMerchant()) return false;
  merchantMenuOpen = true;
  keys.clear();
  mouse.down = false;
  renderMerchantMenu();
  if (merchantMenu) merchantMenu.hidden = false;
  return true;
}

function closeMerchantMenu() {
  merchantMenuOpen = false;
  if (merchantMenu) merchantMenu.hidden = true;
}

const HEALER_PACKS = [
  { hearts: 1, price: 5 },
  { hearts: 2, price: 9 },
  { hearts: 3, price: 12 },
];

function nearHealer() {
  return state?.roomProfile?.type === "healerRoom" && distance(state.player, { x: WIDTH / 2, y: HEIGHT / 2 - 24 }) <= 132;
}

function openHealerMenu() {
  if (!nearHealer()) return false;
  healerMenuOpen = true;
  keys.clear();
  mouse.down = false;
  renderHealerMenu();
  if (healerMenu) healerMenu.hidden = false;
  return true;
}

function closeHealerMenu() {
  healerMenuOpen = false;
  if (healerMenu) healerMenu.hidden = true;
}

function renderHealerMenu() {
  if (!healerOffers || !state) return;
  healerCoins.textContent = state.coins;
  healerOffers.innerHTML = "";
  for (const pack of HEALER_PACKS) {
    const button = document.createElement("button");
    button.className = "merchant-offer";
    button.type = "button";
    button.disabled = state.player.hp >= state.player.maxHp || (!debugState.unlimitedMoney && state.coins < pack.price);
    button.innerHTML = `<img src="${ASSETS.heartRed}" alt=""><strong>+${pack.hearts} vida</strong><span>${pack.price} monedas</span>`;
    button.addEventListener("click", () => buyHealing(pack));
    healerOffers.appendChild(button);
  }
}

function buyHealing(pack) {
  if (!pack || state.player.hp >= state.player.maxHp || (!debugState.unlimitedMoney && state.coins < pack.price)) return;
  if (!debugState.unlimitedMoney) state.coins -= pack.price;
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + pack.hearts);
  state.message = `+${pack.hearts} vida`;
  state.messageTime = 1;
  syncHud();
  renderHealerMenu();
  saveCurrentRun();
}

function openBossUpgradeMenu() {
  if (!upgradeMenu || !upgradeOptions) return;
  upgradeMenuKind = "boss";
  if (upgradeTitle) upgradeTitle.textContent = "Elige una mejora";
  if (upgradeSubtitle) upgradeSubtitle.textContent = "Boss derrotado";
  if (setupPreview) setupPreview.hidden = true;
  const candidates = [...BOSS_UPGRADES];
  const choices = [];
  while (choices.length < 3 && candidates.length) {
    choices.push(candidates.splice(Math.floor(Math.random() * candidates.length), 1)[0]);
  }
  upgradeOptions.innerHTML = "";
  for (const upgrade of choices) {
    const button = document.createElement("button");
    button.className = "upgrade-option";
    button.type = "button";
    button.innerHTML = `<strong>${upgrade.name}</strong><span>${upgrade.description}</span>`;
    button.addEventListener("click", () => chooseBossUpgrade(upgrade));
    upgradeOptions.appendChild(button);
  }
  upgradeMenuOpen = true;
  upgradeMenu.hidden = false;
  keys.clear();
  mouse.down = false;
}

function openSetupUpgradeMenu() {
  if (!upgradeMenu || !upgradeOptions) return;
  const choices = state.player.items.filter((item) => item.id !== "setup" && SETUP_IMPROVEMENTS[item.id] && item.id !== state.player.setupRelicId);
  if (!choices.length) {
    state.message = "Setup guardado: aun no tienes una reliquia mejorable";
    state.messageTime = 1.8;
    return;
  }
  upgradeMenuKind = "setup";
  if (upgradeTitle) upgradeTitle.textContent = "Configura tu Setup";
  if (upgradeSubtitle) upgradeSubtitle.textContent = "Elige una reliquia para potenciarla";
  if (setupPreview) setupPreview.hidden = false;
  upgradeOptions.innerHTML = "";
  for (const relic of choices) {
    const button = document.createElement("button");
    button.className = "upgrade-option";
    button.type = "button";
    const imageSrc = relic.image ? ASSETS[relic.image] : "";
    button.innerHTML = `${imageSrc ? `<img src="${imageSrc}" alt="">` : ""}<strong>${relic.name}</strong>`;
    button.addEventListener("mouseenter", () => renderSetupPreview(relic));
    button.addEventListener("focus", () => renderSetupPreview(relic));
    button.addEventListener("click", () => chooseSetupUpgrade(relic));
    upgradeOptions.appendChild(button);
  }
  upgradeMenuOpen = true;
  upgradeMenu.hidden = false;
  keys.clear();
  mouse.down = false;
}

function renderSetupPreview(relic) {
  if (!setupPreview) return;
  setupPreview.innerHTML = `<strong>${relic.name}</strong><span>${relic.effect}</span><span class="setup-after">Mejora: ${SETUP_IMPROVEMENTS[relic.id]}</span>`;
}

function chooseSetupUpgrade(relic) {
  if (!upgradeMenuOpen || upgradeMenuKind !== "setup" || !relic) return;
  state.player.setupRelicId = relic.id;
  if (relic.id === "llave-porsche") state.player.speed *= 1.1;
  upgradeMenuOpen = false;
  upgradeMenu.hidden = true;
  state.message = `Setup mejorado: ${relic.name}`;
  state.messageTime = 1.6;
  saveCurrentRun();
}

function isSetupEnhanced(id) {
  return state?.player?.setupRelicId === id;
}

function chooseBossUpgrade(upgrade) {
  if (!upgradeMenuOpen || !upgrade) return;
  upgrade.apply(state.player);
  upgradeMenuOpen = false;
  if (upgradeMenu) upgradeMenu.hidden = true;
  state.message = `Mejora: ${upgrade.name}`;
  state.messageTime = 1.2;
  syncHud();
  saveCurrentRun();
}

function tryBuyShopItem(item) {
  if (!item || item.bought) return false;

  if (!debugState.unlimitedMoney && state.coins < item.price) {
    state.message = "No tienes monedas";
    state.messageTime = 0.9;
    return true;
  }

  if (!debugState.unlimitedMoney) state.coins -= item.price;
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
  renderMerchantMenu();
  return true;
}

function renderMerchantMenu() {
  if (!merchantOffers || !merchantCoins || !merchantInfo) return;
  merchantCoins.textContent = debugState.unlimitedMoney ? "âˆž" : state?.coins || 0;
  merchantOffers.innerHTML = "";
  const available = (state?.shopItems || []).filter((item) => !item.bought);
  if (!available.length) {
    merchantOffers.innerHTML = `<p class="merchant-empty">No queda nada a la venta.</p>`;
    return;
  }
  for (const item of available) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "merchant-offer";
    const relic = item.kind === "object" ? normalizeItem(item.item) : null;
    if (relic) button.style.setProperty("--rarity-color", rarityColor(relic.rarity));
    const resourceImage = item.kind === "heart" ? ASSETS.heartRed : ASSETS[item.kind];
    const imageSrc = relic?.image ? ASSETS[relic.image] : item.kind === "nothing" ? "" : resourceImage;
    const image = imageSrc ? `<img src="${imageSrc}" alt="">` : `<span class="merchant-question">?</span>`;
    const description = relic ? relic.effect : item.kind === "nothing" ? "Puede que no recibas nada." : `Compra: ${item.label}.`;
    button.innerHTML = `${image}<strong>${item.label}</strong><span>${item.price}c</span>`;
    const showInfo = () => {
      merchantInfo.innerHTML = `<strong>${item.label}</strong><span>${description}</span>`;
    };
    button.addEventListener("mouseenter", showInfo);
    button.addEventListener("focus", showInfo);
    button.addEventListener("click", () => tryBuyShopItem(item));
    merchantOffers.appendChild(button);
  }
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
    ? [{ x, y: y - 92 }]
    : count === 2
      ? [{ x: x - 172, y: y - 58 }, { x: x + 172, y: y - 58 }]
      : [{ x, y: y - 128 }, { x: x - 188, y: y + 30 }, { x: x + 188, y: y + 30 }];

  for (const position of positions) {
    addChest(variant.type || "woodChest", position.x, position.y);
  }
}

function spawnChestLoot(chestType, x, y) {
  const relic = chooseObject(chestType);
  if (relic) {
    addPickup("object", null, x, y, relic);
    return;
  }
  addResourceBurst(weightedChoice([
    { value: "heart", weight: 44 },
    { value: "bomb", weight: 32 },
    { value: "coin", weight: 24 },
  ]), chestType === "goldChest" ? 4 : chestType === "silverChest" ? 3 : 2, x, y);
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
  } else if (text === "heart" || text.includes("corazÃ³n") || text.includes("curaciÃ³n")) {
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
  return weightedChoiceFromObject(weights) || "Poco comÃºn";
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
  if (text.includes("mÃ­tica") || text.includes("mitica")) return "MÃ­tica";
  if (text.includes("legend")) return "Legendaria";
  if (text.includes("Ã©pica") || text.includes("epica")) return "Ã‰pica";
  if (text.includes("rara")) return "Rara";
  if (text.includes("poco")) return "Poco comÃºn";
  if (text.includes("comÃºn") || text.includes("comun")) return "ComÃºn";
  return null;
}

function normalizeItem(item = {}) {
  const name = item.name || item.Objeto || "Reliquia";
  return {
    id: item.id || hashString(name),
    name,
    rarity: (item.rarity || item.Rareza || "Poco comÃºn") === "ComÃºn" ? "Poco comÃºn" : item.rarity || item.Rareza || "Poco comÃºn",
    type: item.type || item.Tipo || "Reliquia",
    effect: item.effect || item.Efecto || "+ poder",
    penalty: item.penalty || item["PenalizaciÃ³n/nota"] || item.note || null,
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
  state.minecraftBlocks = [];
  state.minecraftSummons = [];
  state.discoZones = [];
  state.damageNumbers = [];
  state.allies = [];
  state.toxicTrails = [];
  state.pickups = [];
  state.chests = [];
  state.shopItems = [];
  state.cleared = false;
  state.message = "";
  state.roomProfile = createRoomProfile(state.room, entrySide);
  if (state.roomProfile.type === "chestRoom" && !state.chestRoomHistory.includes(state.room)) {
    state.chestRoomHistory.push(state.room);
  }
  state.player.roomDamaged = false;
  state.player.roomTime = 0;
  state.player.trailTimer = 0;

  const profile = state.roomProfile;
  if (state.debugLab) {
    setupDebugLab(profile);
    return;
  }
  const enemyBudget = Math.max(isCombatRoom(profile.type) ? 1 : 0, getEnemyCount(profile));
  if (state.room === 45) {
    spawnXavi();
    return;
  }
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
    spentBudget += getEnemySpawnCost(role, archetype);
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
      sprite: archetype.sprite || null,
      specialTimer: archetype.name === "Ferri" ? 2.8 + Math.random() * 4 : 99,
      specialPrompt: 0,
      specialReply: 0,
      stun: 0,
      chargeDelay: archetype.pattern === "maki" ? 0.45 + Math.random() * 1.3 : 0,
      rollVx: 0,
      rollVy: 0,
    });
    i += 1;
  }
  spawnRoomAnts();
}

function spawnXavi() {
  state.enemies.push({
    x: WIDTH / 2, y: HEIGHT / 2 - 34, r: 46, hp: 42, maxHp: 42, speed: 310,
    wobble: 0, shoot: 99, summon: 99, hit: 0, boss: false, finalBoss: false, damage: 0,
    name: "Xavi", tint: "rgba(255, 80, 187, 0.34)", canShoot: false, role: "elite",
    pattern: "xavi", sprite: "enemyXaviJump", specialTimer: 99, specialPrompt: 0, specialReply: 0,
    stun: 0, chargeDelay: 0, rollVx: 0, rollVy: 0, laserCooldown: 0, jumpFlip: false,
    xaviAwakened: false, xaviAimTimer: 0,
    xaviDodgeCooldown: 0,
  });
}

function setupDebugLab(profile) {
  profile.type = "jokeRoom";
  profile.doorsOpen = false;
  profile.doorSides = [];
  profile.bombDoorSide = null;
  state.player.x = WIDTH / 2;
  state.player.y = HEIGHT - 138;
  state.player.hp = state.player.maxHp;
  state.cleared = true;
  state.coins = 99;
  state.keys = 99;
  state.bombs = 99;
  const columns = 7;
  for (const [index, relic] of RELIC_CATALOG.entries()) {
    const col = index % columns;
    const row = Math.floor(index / columns);
    addPickup("object", null, 250 + col * 130, 175 + row * 128, relic);
  }
  addChest("woodChest", WIDTH - 192, HEIGHT - 142);
  addChest("silverChest", WIDTH - 322, HEIGHT - 142);
  addChest("goldChest", WIDTH - 452, HEIGHT - 142);
  state.message = "Laboratorio 2345";
  state.messageTime = 1.4;
  syncHud();
}

function selectEnemyArchetype(profile, index) {
  if (profile.type === "boss") {
    return getBossArchetype(profile);
  }

  const tier = enemyTierForRoom(state.room);
  const themeList = ENEMY_CATALOG[profile.theme.name] || ENEMY_CATALOG.Isaac;
  if (profile.theme.name === "Iglesia") {
    const bibles = themeList.filter((enemy) => enemy.name.includes("Biblia"));
    const ferri = themeList.find((enemy) => enemy.name === "Ferri");
    const ferriChanceByRoom = { 31: 0, 32: 0.08, 33: 0.16, 34: 0.25, 35: 0.38, 36: 0.54, 37: 0.68, 38: 0.82, 39: 0.94 };
    const ferriChance = ferriChanceByRoom[state.room] ?? 1;
    if (ferri && Math.random() < ferriChance) return ferri;
    return bibles[index % bibles.length];
  }
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

function getEnemySpawnCost(role, archetype = null) {
  if (archetype?.pattern === "maki") return 3.1;
  if (archetype?.name === "Mosca") return 0.58;
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
  if (role === "runner") return archetype.name === "Mosca" ? archetype.speedScale * 0.94 : Math.min(1.12, archetype.speedScale * 0.84);
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
  applyRoomClearRelics();

  if (state.roomProfile.type === "boss") {
    save.bossesDefeated = (save.bossesDefeated || 0) + 1;
    writeSave();
    state.message = "Boss derrotado";
    state.messageTime = 1.2;
    if (hasRelic("crep-chocolate")) state.player.hp = Math.min(state.player.maxHp, state.player.hp + (isSetupEnhanced("crep-chocolate") ? 3 : 2));
    if (hasRelic("llave-porsche") && (state.player.bossesWithPorsche || 0) < 5) {
      state.player.bossesWithPorsche = (state.player.bossesWithPorsche || 0) + 1;
      state.player.speed *= 1.03;
    }
    openBossUpgradeMenu();
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
  save.deaths = (save.deaths || 0) + 1;
  save.currentRun = null;
  writeSave();
  runSummary.textContent = `Has llegado a la sala ${state.room}. Mejor sala: ${save.bestRoom}.`;
  setMode("gameover");
}

function winRun() {
  save.bestRoom = 100;
  save.wins = (save.wins || 0) + 1;
  save.currentRun = null;
  writeSave();
  state.message = "Victoria";
  state.messageTime = 2;
  victorySummary.textContent = "Has derrotado al boss de la sala 100.";
  setMode("victory");
}

function update(dt) {
  if (mode !== "game") return;
  if (merchantMenuOpen || healerMenuOpen || upgradeMenuOpen) return;

  const player = state.player;
  player.invuln = Math.max(0, player.invuln - dt);
  player.hitFlash = Math.max(0, player.hitFlash - dt);
  player.itemPose = Math.max(0, player.itemPose - dt);
  player.fireCooldown = Math.max(0, player.fireCooldown - dt);
  player.paralysis = Math.max(0, (player.paralysis || 0) - dt);
  player.roomTime = (player.roomTime || 0) + dt;
  if (hasRelic("papel-higienico")) player.paperCharge = Math.min(hasRelic("silla-gamer") ? 14 : 18, (player.paperCharge || 0) + dt);
  updateMando(dt);
  state.messageTime = Math.max(0, state.messageTime - dt);
  state.shake = Math.max(0, state.shake - dt);

  updatePlayer(dt);
  updateRelicEntities(dt);
  updateMinecraftBlocks(dt);
  updateDiscoZones(dt);
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
  if (player.paralysis > 0) return;
  let mx = 0;
  let my = 0;

  if (keys.has("KeyA") || keys.has("ArrowLeft")) mx -= 1;
  if (keys.has("KeyD") || keys.has("ArrowRight")) mx += 1;
  if (keys.has("KeyW") || keys.has("ArrowUp")) my -= 1;
  if (keys.has("KeyS") || keys.has("ArrowDown")) my += 1;

  const mag = Math.hypot(mx, my) || 1;
  player.stationaryTime = mx || my ? 0 : (player.stationaryTime || 0) + dt;
  if ((mx || my) && hasRelic("calcetin-sucio")) {
    player.trailTimer = (player.trailTimer || 0) - dt;
    if (player.trailTimer <= 0) {
      player.trailTimer = 0.09;
      state.toxicTrails.push({ x: player.x, y: player.y + 12, life: 4, maxLife: 4, r: 24 });
    }
  }
  const previousX = player.x;
  const previousY = player.y;
  player.x += (mx / mag) * player.speed * dt;
  player.y += (my / mag) * player.speed * dt;
  if (state.minecraftBlocks.some((block) => circleHitsBlock(player, block))) {
    player.x = previousX;
    player.y = previousY;
  }

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
  const chairBoost = hasRelic("silla-gamer") && (player.stationaryTime || 0) >= 1 ? (isSetupEnhanced("silla-gamer") ? 0.75 : 0.85) : 1;
  const colacaoDuration = isSetupEnhanced("colacao") ? 16 : hasRelic("crep-chocolate") ? 13 : 10;
  const colacaoBoost = hasRelic("colacao") && (player.roomTime || 0) <= colacaoDuration ? 0.78 : 1;
  player.fireCooldown = player.fireDelay * chairBoost * colacaoBoost;
  player.aimX = nx;
  player.aimY = ny;
  player.shotCounter = (player.shotCounter || 0) + 1;
  const critical = Math.random() < (player.critChance || 0);
  const hurtBonus = player.hp <= Math.ceil(player.maxHp / 2) ? (player.hurtDamageBonus || 0) : 0;
  const shotDamage = (player.damage * (1 + hurtBonus)) * (critical ? 2 : 1);

  if (nx < -0.25) {
    player.facing = nx < 0 ? "left" : "right";
  } else if (nx > 0.25) {
    player.facing = "right";
  } else {
    player.facing = "front";
  }

  const paperReady = hasRelic("papel-higienico") && player.paperCharge >= (hasRelic("silla-gamer") ? 14 : 18);
  const chopsticks = hasRelic("palillos-chinos") && player.shotCounter % 4 === 0;
  if (paperReady) player.paperCharge = 0;
  const angles = paperReady
    ? isSetupEnhanced("papel-higienico") ? [-0.38, -0.19, 0, 0.19, 0.38] : [-0.22, 0, 0.22]
    : chopsticks
      ? isSetupEnhanced("palillos-chinos") ? [-0.24, -0.12, 0, 0.12, 0.24] : [-0.12, 0, 0.12]
      : [0];
  for (const angle of angles) addPlayerShot(nx, ny, shotDamage * (chopsticks ? 0.72 : 1), critical, angle);
}

function addPlayerShot(nx, ny, damage, critical = false, angleOffset = 0, automatic = false) {
  const player = state.player;
  const angle = Math.atan2(ny, nx) + angleOffset;
  const sx = Math.cos(angle);
  const sy = Math.sin(angle);
  state.shots.push({
    x: player.x + sx * 24,
    y: player.y + sy * 22,
    vx: sx * 560,
    vy: sy * 560,
    r: (critical ? 10 : 8) + (player.tearSizeBonus || 0),
    life: Math.max(1.8, 4.0 + (player.shotLifeBonus || 0)),
    damage,
    critical,
    automatic,
    appliesSoja: hasRelic("salsa-soja") && Math.random() < (isSetupEnhanced("salsa-soja") ? 0.24 : 0.12),
    appliesSpicy: hasRelic("salsa-good-soup") && Math.random() < (isSetupEnhanced("salsa-good-soup") ? 0.20 : 0.10),
  });
}

function updateMando(dt) {
  const player = state.player;
  if (!hasRelic("mando") || !state.enemies.length) return;
  player.autoShotTimer = (player.autoShotTimer || 0) - dt;
  if (player.autoShotTimer > 0) return;
  player.autoShotTimer = isSetupEnhanced("mando") ? 1 : 2;
  const target = [...state.enemies].sort((a, b) => distance(player, a) - distance(player, b))[0];
  addPlayerShot(target.x - player.x, target.y - player.y, player.damage * 0.4, false, 0, true);
}

function spawnRoomAnts() {
  if (!state || !isCombatRoom(state.roomProfile.type)) return;
  const hasAnt = hasRelic("hormiga");
  const hasNest = hasRelic("hormiguero");
  let count = 0;
  if (hasAnt && hasNest) count = 1;
  else if (hasAnt && Math.random() < (isSetupEnhanced("hormiga") ? 0.6 : 0.35)) count = 1;
  else if (hasNest && state.room % 3 === 0) count = 1;
  if (hasAnt && hasNest && Math.random() < 0.32) count += 1;
  for (let i = 0; i < Math.min(isSetupEnhanced("hormiguero") ? 5 : 3, count); i += 1) {
    state.allies.push({ x: state.player.x + (i - 1) * 18, y: state.player.y + 30, r: 9, bite: 0 });
  }
}

function updateRelicEntities(dt) {
  const player = state.player;
  for (const trail of state.toxicTrails) {
    trail.life -= dt;
    for (const enemy of state.enemies) {
      if (distance(trail, enemy) < trail.r + enemy.r) enemy.hp -= player.damage * (isSetupEnhanced("calcetin-sucio") ? 0.24 : 0.16) * dt;
    }
  }
  state.toxicTrails = state.toxicTrails.filter((trail) => trail.life > 0);

  for (const ant of state.allies) {
    ant.bite = Math.max(0, ant.bite - dt);
    const target = [...state.enemies].filter((enemy) => enemy.hp > 0).sort((a, b) => distance(ant, a) - distance(ant, b))[0];
    if (!target) continue;
    const dx = target.x - ant.x;
    const dy = target.y - ant.y;
    const mag = Math.hypot(dx, dy) || 1;
    ant.x += (dx / mag) * 178 * dt;
    ant.y += (dy / mag) * 178 * dt;
    if (mag < ant.r + target.r + 4 && ant.bite <= 0) {
      ant.bite = 0.52;
      target.hp -= Math.max(0.55, player.damage * 0.32);
      target.hit = Math.max(target.hit, 0.1);
    }
  }

  if (hasRelic("rasta-dani")) {
    player.rastaAngle = (player.rastaAngle || 0) + dt * (isSetupEnhanced("rasta-dani") ? 6.6 : 4.4);
    const orbit = { x: player.x + Math.cos(player.rastaAngle) * 56, y: player.y + Math.sin(player.rastaAngle) * 38, r: 16 };
    player.rastaOrbit = orbit;
    for (const enemy of state.enemies) {
      if (distance(orbit, enemy) < orbit.r + enemy.r) enemy.hp -= player.damage * (isSetupEnhanced("rasta-dani") ? 1.2 : 0.8) * dt;
    }
    for (const shot of state.enemyShots) {
      if (shot.life > 0 && shot.r <= 9 && distance(orbit, shot) < orbit.r + shot.r && Math.random() < 0.3) shot.life = 0;
    }
  } else {
    player.rastaOrbit = null;
  }
}

function triggerTalonKill() {
  const player = state.player;
  if (!hasRelic("talon")) return;
  player.talonKills = (player.talonKills || 0) + 1;
  if (player.talonKills % (isSetupEnhanced("talon") ? 8 : 12) !== 0 || !state.enemies.length) return;
  const target = [...state.enemies].filter((enemy) => enemy.hp > 0).sort((a, b) => b.hp - a.hp)[0];
  if (!target) return;
  const damage = Math.max(4, player.damage * 3.2);
  target.hp -= damage;
  addDamageNumber(target, damage, true);
  state.message = "Talon";
  state.messageTime = 0.7;
}

function applyRoomClearRelics() {
  const player = state.player;
  if (!isCombatRoom(state.roomProfile.type)) return;
  player.fightRooms = (player.fightRooms || 0) + 1;
  if (hasRelic("tecla") && !player.roomDamaged && (player.perfectRooms || 0) < 50) {
    player.perfectRooms = (player.perfectRooms || 0) + 1;
    player.fireDelay = Math.max(0.1, player.fireDelay * (isSetupEnhanced("tecla") ? 0.995 : 0.997));
  }
  if (hasRelic("nigiri-salmon") && player.fightRooms % (isSetupEnhanced("nigiri-salmon") ? 3 : hasRelic("palillos-chinos") ? 4 : 5) === 0) {
    player.hp = Math.min(player.maxHp, player.hp + 1);
  }
  if (hasRelic("pegatina-perros") && Math.random() < (isSetupEnhanced("pegatina-perros") ? 0.22 : hasRelic("perros-code") ? 0.15 : 0.1)) {
    const reward = weightedChoice([
      { value: "coin", weight: 50 },
      { value: "heart", weight: 25 },
      { value: "key", weight: 20 },
      { value: "bomb", weight: 5 },
    ]);
    addResourceBurst(reward, 1, WIDTH / 2 + 58, HEIGHT / 2 - 34);
  }
  if (hasRelic("perros-code") && state.room % (isSetupEnhanced("perros-code") ? 3 : 4) === 0) {
    const article = randomInt(0, 3);
    if (article === 0) state.player.damage += 0.1;
    if (article === 1) state.player.fireDelay = Math.max(0.1, state.player.fireDelay * 0.98);
    if (article === 2) addResourceBurst("coin", 2, WIDTH / 2 - 58, HEIGHT / 2 - 34);
    if (article === 3) state.player.damageReduction = Math.min(0.55, (state.player.damageReduction || 0) + 0.04);
    state.message = "Perros Code";
    state.messageTime = 0.9;
  }
  player.roomDamaged = false;
}

function updateShots(dt) {
  for (const shot of state.shots) {
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    shot.life -= dt;
    if (state.minecraftBlocks.some((block) => circleHitsBlock(shot, block))) shot.life = 0;
  }

  for (const shot of state.enemyShots) {
    if (shot.boomerang && shot.owner?.hp > 0) {
      shot.age = (shot.age || 0) + dt;
      if (shot.age >= shot.returnAfter) {
        const dx = shot.owner.x - shot.x;
        const dy = shot.owner.y - shot.y;
        const mag = Math.hypot(dx, dy) || 1;
        shot.vx += (dx / mag) * 980 * dt;
        shot.vy += (dy / mag) * 980 * dt;
        const speed = Math.hypot(shot.vx, shot.vy) || 1;
        if (speed > 520) {
          shot.vx = (shot.vx / speed) * 520;
          shot.vy = (shot.vy / speed) * 520;
        }
        if (shot.age > shot.returnAfter + 0.35 && distance(shot, shot.owner) < shot.owner.r + 18) shot.life = 0;
      }
    }
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    shot.life -= dt;
    const hitBlock = state.minecraftBlocks.find((block) => circleHitsBlock(shot, block));
    if (hitBlock) {
      if (shot.minecraftPickaxe) hitBlock.life = 0;
      else shot.life = 0;
    }
  }

  for (const enemy of state.enemies) {
    enemy.hit = Math.max(0, enemy.hit - dt);
    for (const shot of state.shots) {
      if (shot.life > 0 && enemy.pattern === "xavi" && !enemy.xaviAwakened && (enemy.xaviDodgeCooldown || 0) <= 0 && distance(enemy, shot) < enemy.r + 190) {
        dodgeXaviShot(enemy, shot);
        continue;
      }
      if (shot.life > 0 && distance(enemy, shot) < enemy.r + shot.r) {
        const debuffBonus = (enemy.sanded || 0) > 0 ? (isSetupEnhanced("lijadora") ? 1.18 : 1.1) : 1;
        const sojaBonus = (enemy.soja || 0) > 0 ? 1.08 : 1;
        const damage = debugState.oneShot ? Math.max(enemy.hp, shot.damage) : shot.damage * debuffBonus * sojaBonus;
        enemy.hp -= damage;
        if (enemy.pattern === "enderman" && enemy.hp > 0 && (enemy.teleportCooldown || 0) <= 0) teleportEnderman(enemy);
        if (enemy.pattern === "xavi" && enemy.hp > 0 && !enemy.xaviAwakened) {
          enemy.xaviAwakened = true;
          enemy.xaviAimTimer = 0.7;
          enemy.sprite = "enemyXaviLaser";
        }
        if (hasRelic("lijadora")) enemy.sanded = 3;
        if (shot.appliesSoja) enemy.soja = 4;
        if (shot.appliesSpicy) enemy.spicy = 3;
        if (enemy.soja > 0 && enemy.spicy > 0 && (!enemy.comboCooldown || enemy.comboCooldown <= 0)) {
          enemy.hp -= Math.max(1, player.damage * 0.45);
          enemy.comboCooldown = 1;
        }
        if (hasRelic("cable-mordido")) chainCableDamage(enemy);
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

  for (const enemy of state.enemies) {
    if (enemy.hp <= 0 && !enemy.deathCounted) {
      enemy.deathCounted = true;
      triggerTalonKill();
    }
  }
  state.enemies = state.enemies.filter((enemy) => enemy.hp > 0);
  state.shots = state.shots.filter((shot) => shot.life > 0 && inBounds(shot.x, shot.y, 720));
  state.enemyShots = state.enemyShots.filter((shot) => shot.life > 0 && inBounds(shot.x, shot.y, 90));
}

function dodgeXaviShot(enemy, shot) {
  const shotSpeed = Math.hypot(shot.vx, shot.vy) || 1;
  const side = Math.random() < 0.5 ? -1 : 1;
  const nx = (-shot.vy / shotSpeed) * side;
  const ny = (shot.vx / shotSpeed) * side;
  enemy.x = clamp(enemy.x + nx * 300, 132, WIDTH - 132);
  enemy.y = clamp(enemy.y + ny * 230, 122, HEIGHT - 106);
  enemy.jumpFlip = !enemy.jumpFlip;
  enemy.xaviDodgeCooldown = 0.08;
  enemy.jumpTimer = 0.22;
}

function chainCableDamage(origin) {
  let previous = origin;
  const hit = new Set([origin]);
  const maxBounces = isSetupEnhanced("cable-mordido") ? 5 : 3;
  for (let bounce = 0; bounce < maxBounces; bounce += 1) {
    const chained = state.enemies
      .filter((other) => !hit.has(other) && other.hp > 0 && distance(previous, other) < 260)
      .sort((a, b) => distance(previous, a) - distance(previous, b))[0];
    if (!chained) return;
    const chainDamage = Math.max(1, state.player.damage * (0.58 - bounce * 0.1));
    chained.hp -= chainDamage;
    chained.hit = Math.max(chained.hit, 0.14);
    addDamageNumber(chained, chainDamage);
    hit.add(chained);
    previous = chained;
  }
}

function circleHitsBlock(circle, block) {
  const nearestX = clamp(circle.x, block.x - block.r, block.x + block.r);
  const nearestY = clamp(circle.y, block.y - block.r, block.y + block.r);
  return Math.hypot(circle.x - nearestX, circle.y - nearestY) < (circle.r || 0);
}

function updateMinecraftBlocks(dt) {
  for (const block of state.minecraftBlocks) block.life -= dt;
  state.minecraftBlocks = state.minecraftBlocks.filter((block) => block.life > 0);
  for (const summon of state.minecraftSummons) summon.life -= dt;
  for (const summon of state.minecraftSummons.filter((item) => item.life <= 0)) spawnSamuEnderman(summon.x, summon.y);
  state.minecraftSummons = state.minecraftSummons.filter((summon) => summon.life > 0);
}

function updateDiscoZones(dt) {
  for (const zone of state.discoZones) {
    zone.life -= dt;
    if (zone.kind === "xaviLaser" && zone.owner?.hp > 0) {
      const trackingSpeed = zone.warning > 0 ? 0.34 : 0.24;
      zone.angle += clamp(angleDifference(Math.atan2(state.player.y - zone.owner.y, state.player.x - zone.owner.x), zone.angle), -trackingSpeed * dt, trackingSpeed * dt);
      zone.x = zone.owner.x;
      zone.y = zone.owner.y;
      if (zone.warning <= 0 && lineHitsPlayer(zone, 34) && state.player.invuln <= 0) hurtPlayer(2);
    }
    if (zone.kind === "jajoFlash" && zone.warning <= 0 && !zone.triggered) {
      zone.triggered = true;
      if (lineHitsPlayer(zone, zone.width)) state.player.paralysis = Math.max(state.player.paralysis || 0, 0.95);
      fireJajoBurst(zone.owner, zone.projectiles);
    }
    zone.warning -= dt;
  }
  state.discoZones = state.discoZones.filter((zone) => zone.life > 0);
}

function angleDifference(target, current) {
  return Math.atan2(Math.sin(target - current), Math.cos(target - current));
}

function lineHitsPlayer(zone, width) {
  const dx = state.player.x - zone.x;
  const dy = state.player.y - zone.y;
  const along = Math.cos(zone.angle) * dx + Math.sin(zone.angle) * dy;
  const across = Math.abs(-Math.sin(zone.angle) * dx + Math.cos(zone.angle) * dy);
  return along >= 0 && along <= (zone.length || 980) && across <= width / 2 + state.player.r;
}

function addMinecraftBlock(x, y, life = 5) {
  if (distance(state.player, { x, y }) < 108) return false;
  state.minecraftBlocks.push({ x: clamp(x, 150, WIDTH - 150), y: clamp(y, 138, HEIGHT - 122), r: 34, life });
  return true;
}

function teleportEnderman(enemy) {
  const angle = Math.random() * Math.PI * 2;
  const radius = 142 + Math.random() * 78;
  enemy.x = clamp(state.player.x + Math.cos(angle) * radius, 132, WIDTH - 132);
  enemy.y = clamp(state.player.y + Math.sin(angle) * radius, 122, HEIGHT - 106);
  enemy.teleportCooldown = 1.25;
  enemy.hit = 0.2;
}

function addDamageNumber(enemy, damage, critical = false) {
  if (!state || !options.damageNumbers) return;
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
  enemy.name = "MÃ³nica";
  enemy.pattern = "monica";
  enemy.sprite = "bossMonica";
  enemy.tint = "rgba(255, 124, 160, 0.36)";
  enemy.hp = nextHp;
  enemy.maxHp = nextHp;
  enemy.speed *= 1.08;
  enemy.canShoot = false;
  enemy.shoot = 99;
  enemy.summon = 0.6;
  state.message = "MÃ³nica entra";
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
    enemy.specialTimer -= dt;
    const previousPrompt = enemy.specialPrompt || 0;
    enemy.specialPrompt = Math.max(0, previousPrompt - dt);
    enemy.specialReply = Math.max(0, (enemy.specialReply || 0) - dt);
    enemy.stun = Math.max(0, (enemy.stun || 0) - dt);
    enemy.sanded = Math.max(0, (enemy.sanded || 0) - dt);
    enemy.soja = Math.max(0, (enemy.soja || 0) - dt);
    enemy.spicy = Math.max(0, (enemy.spicy || 0) - dt);
    enemy.comboCooldown = Math.max(0, (enemy.comboCooldown || 0) - dt);
    enemy.teleportCooldown = Math.max(0, (enemy.teleportCooldown || 0) - dt);
    enemy.laserCooldown = Math.max(0, (enemy.laserCooldown || 0) - dt);
    enemy.xaviAimTimer = Math.max(0, (enemy.xaviAimTimer || 0) - dt);
    enemy.jumpTimer = Math.max(0, (enemy.jumpTimer || 0) - dt);
    enemy.xaviDodgeCooldown = Math.max(0, (enemy.xaviDodgeCooldown || 0) - dt);
    if (enemy.spicy > 0) enemy.hp -= state.player.damage * 0.12 * dt;
    enemy.chargeDelay = Math.max(0, (enemy.chargeDelay || 0) - dt);

    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const mag = Math.hypot(dx, dy) || 1;

    if (enemy.pattern === "creeper") {
      if (mag < 126 && !enemy.creeperFuse) enemy.creeperFuse = 0.82;
      if (enemy.creeperFuse > 0) {
        enemy.creeperFuse -= dt;
        if (enemy.creeperFuse <= 0) {
          explodeCreeper(enemy);
          continue;
        }
        continue;
      }
    }

    if (enemy.pattern === "xavi" && enemy.xaviLaser) {
      enemy.xaviLaser -= dt;
      if (enemy.xaviLaser <= 0) {
        enemy.sprite = "enemyXaviLaser";
        enemy.xaviAimTimer = 2.1;
      }
      continue;
    }

    if (enemy.pattern === "xavi" && enemy.xaviAwakened && enemy.xaviAimTimer > 0) {
      enemy.sprite = "enemyXaviLaser";
      continue;
    }

    if (enemy.pattern === "xavi" && enemy.xaviAwakened && !enemy.xaviLaser) {
      triggerXaviLaser(enemy);
      continue;
    }

    if (enemy.stun > 0) {
      continue;
    } else if (enemy.pattern === "maki") {
      if (!enemy.rollVx && !enemy.rollVy && enemy.chargeDelay <= 0) {
        enemy.rollVx = (dx / mag) * 620;
        enemy.rollVy = (dy / mag) * 620;
      }
      enemy.x += enemy.rollVx * dt;
      enemy.y += enemy.rollVy * dt;
      if (enemy.x <= 112 || enemy.x >= WIDTH - 112) {
        stunMaki(enemy);
      }
      if (enemy.y <= 104 || enemy.y >= HEIGHT - 86) {
        stunMaki(enemy);
      }
    } else if (enemy.boss) {
      updateBossMovement(enemy, dx, dy, mag, dt);
    } else if (enemy.pattern === "xavi") {
      if (enemy.jumpTimer <= 0) {
        enemy.jumpTimer = 0.28;
        enemy.jumpFlip = !enemy.jumpFlip;
      }
      enemy.x += (Math.random() - 0.5) * enemy.speed * 2.4 * dt;
      enemy.y += (Math.random() - 0.5) * enemy.speed * 2.4 * dt;
    } else {
      enemy.x += (dx / mag) * enemy.speed * dt;
      enemy.y += (dy / mag) * enemy.speed * dt;
      enemy.x += Math.sin(enemy.wobble) * (enemy.pattern === "drunk" ? 42 : 12) * dt;
      enemy.y += Math.cos(enemy.wobble * 0.7) * 10 * dt;
    }
    enemy.x = clamp(enemy.x, 112, WIDTH - 112);
    enemy.y = clamp(enemy.y, 104, HEIGHT - 86);

    if (enemy.name === "Ferri" && enemy.specialPrompt <= 0 && enemy.specialReply <= 0 && enemy.specialTimer <= 0) {
      enemy.specialPrompt = 1.7;
      enemy.specialTimer = 5.5 + Math.random() * 3;
    }
    if (enemy.name === "Ferri" && previousPrompt > 0 && enemy.specialPrompt <= 0) {
      triggerFerriRush();
    }

    if (enemy.pattern !== "xavi" && distance(player, enemy) < player.r + enemy.r && player.invuln <= 0) {
      hurtPlayer(enemy.damage || 1);
      if (enemy.pattern === "maki") stunMaki(enemy);
    }

    if ((player.dirtyAura || 0) > 0 && !enemy.boss && distance(player, enemy) < 112) {
      enemy.hp -= player.dirtyAura * dt * 0.85;
      enemy.hit = Math.max(enemy.hit, 0.05);
    }

    if (enemy.pattern === "ninja" && enemy.shoot <= 0) {
      enemy.shoot = 1.25 + Math.random() * 0.7;
      shootBossRing(enemy, 8, 245);
    } else if (enemy.canShoot && enemy.pattern !== "alex" && enemy.shoot <= 0 && state.room >= 2) {
      enemy.shoot = enemy.pattern === "pooter" ? 2 + Math.random() : enemy.pattern === "clotty" ? 2.45 + Math.random() * 0.55 : enemy.finalBoss ? 0.5 + Math.random() * 0.25 : enemy.boss ? 0.95 + Math.random() * 0.55 : 1.7 + Math.random() * 1.2;
      const shotSpeed = enemy.finalBoss ? 360 : enemy.boss ? 300 : 260;
      const angle = Math.atan2(dy, dx);
      const spreads = enemy.pattern === "clotty" ? [-0.28, 0, 0.28] : [0];
      for (const spread of spreads) {
        state.enemyShots.push({ x: enemy.x, y: enemy.y, vx: Math.cos(angle + spread) * shotSpeed, vy: Math.sin(angle + spread) * shotSpeed, r: enemy.finalBoss ? 9 : 7, life: 2, damage: enemy.damage || 1 });
      }

      if (enemy.finalBoss) {
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

  separateEnemies();
}

function explodeCreeper(enemy) {
  const blastRadius = enemy.name === "Creeper cargado" ? 178 : 150;
  enemy.hp = 0;
  enemy.exploded = true;
  if (distance(state.player, enemy) < blastRadius && state.player.invuln <= 0) {
    hurtPlayer(enemy.name === "Creeper cargado" ? 2 : 1);
  }
  for (const other of state.enemies) {
    if (other !== enemy && !other.boss && distance(other, enemy) < blastRadius) {
      other.hp -= Math.max(8, enemy.maxHp * 0.42);
      other.hit = Math.max(other.hit, 0.18);
    }
  }
  state.damageNumbers.push({
    x: enemy.x,
    y: enemy.y - enemy.r,
    vx: 0,
    value: "BOOM",
    life: 0.7,
    maxLife: 0.7,
    critical: true,
  });
}

function stunMaki(enemy) {
  enemy.rollVx = 0;
  enemy.rollVy = 0;
  enemy.stun = 1.35;
  enemy.chargeDelay = 0.35;
}

function separateEnemies() {
  const enemies = state.enemies;
  for (let i = 0; i < enemies.length; i += 1) {
    const first = enemies[i];
    for (let j = i + 1; j < enemies.length; j += 1) {
      const second = enemies[j];
      let dx = second.x - first.x;
      let dy = second.y - first.y;
      let currentDistance = Math.hypot(dx, dy);
      const minimumDistance = (first.r + second.r) * 0.62;
      if (currentDistance >= minimumDistance) continue;
      if (currentDistance < 0.001) {
        dx = Math.random() - 0.5 || 0.5;
        dy = Math.random() - 0.5 || -0.5;
        currentDistance = Math.hypot(dx, dy);
      }
      const overlap = minimumDistance - currentDistance;
      const nx = dx / currentDistance;
      const ny = dy / currentDistance;
      const firstPush = first.boss ? 0.18 : second.boss ? 0.82 : 0.5;
      const secondPush = second.boss ? 0.18 : first.boss ? 0.82 : 0.5;
      first.x = clamp(first.x - nx * overlap * firstPush, 112, WIDTH - 112);
      first.y = clamp(first.y - ny * overlap * firstPush, 104, HEIGHT - 86);
      second.x = clamp(second.x + nx * overlap * secondPush, 112, WIDTH - 112);
      second.y = clamp(second.y + ny * overlap * secondPush, 104, HEIGHT - 86);
      if (first.pattern === "maki" && Math.hypot(first.rollVx || 0, first.rollVy || 0) > 0) stunMaki(first);
      if (second.pattern === "maki" && Math.hypot(second.rollVx || 0, second.rollVy || 0) > 0) stunMaki(second);
    }
  }
}

function triggerFerriRush() {
  const player = state.player;
  for (const ferri of state.enemies.filter((enemy) => enemy.name === "Ferri")) {
    const dx = player.x - ferri.x;
    const dy = player.y - ferri.y;
    const mag = Math.hypot(dx, dy) || 1;
    ferri.x = clamp(player.x - (dx / mag) * 24, 112, WIDTH - 112);
    ferri.y = clamp(player.y - (dy / mag) * 24, 104, HEIGHT - 86);
  }
  if (player.invuln <= 0) hurtPlayer(1);
  state.message = "Los Ferris cargan";
  state.messageTime = 0.9;
}

function clickFerriPrompt() {
  const ferri = state?.enemies?.find((enemy) =>
    enemy.name === "Ferri"
    && enemy.specialPrompt > 0
    && distance(mouse, { x: enemy.x, y: enemy.y - enemy.r - 34 }) < 58
  );
  if (!ferri) return false;
  ferri.specialPrompt = 0;
  ferri.specialReply = 1.5;
  ferri.specialTimer = 5.5 + Math.random() * 3;
  state.message = "LO QUE?";
  state.messageTime = 1.1;
  return true;
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
  if (enemy.pattern === "alex") {
    updateAlexPattern(enemy, dt);
    return;
  }
  if (enemy.pattern === "samu") {
    updateSamuPattern(enemy);
    return;
  }
  if (enemy.pattern === "jajo") {
    updateJajoPattern(enemy);
    return;
  }
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

  if (enemy.pattern === "victor" && enemy.summon <= 0) {
    enemy.summon = 1.08 + Math.random() * 0.22;
    enemy.attackStep = ((enemy.attackStep || 0) + 1) % 4;
    shootVictorPattern(enemy, enemy.attackStep);
  }
}

function triggerXaviLaser(enemy) {
  enemy.xaviLaser = 3.4;
  enemy.laserCooldown = 0;
  enemy.sprite = "enemyXaviLaser";
  state.discoZones.push({
    kind: "xaviLaser", owner: enemy, x: enemy.x, y: enemy.y,
    angle: Math.atan2(state.player.y - enemy.y, state.player.x - enemy.x),
    warning: 1.05, life: 3.4, length: 1100,
  });
}

function updateJajoPattern(enemy) {
  if (enemy.summon > 0) return;
  const phaseTwo = enemy.hp <= enemy.maxHp * 0.5;
  enemy.summon = phaseTwo ? 1.75 : 2.6;
  addJajoFlash(enemy, phaseTwo);
  if (phaseTwo && Math.random() < 0.45) {
    setTimeout(() => {
      if (enemy.hp > 0) addJajoFlash(enemy, true);
    }, 520);
  }
}

function addJajoFlash(enemy, phaseTwo) {
  const angle = Math.atan2(state.player.y - enemy.y, state.player.x - enemy.x);
  state.discoZones.push({
    kind: "jajoFlash", owner: enemy, x: enemy.x, y: enemy.y, angle,
    warning: phaseTwo ? 0.82 : 1.15, life: phaseTwo ? 1.18 : 1.48,
    width: phaseTwo ? 210 : 164, length: 1180, projectiles: phaseTwo ? 5 : 3, triggered: false,
  });
}

function fireJajoBurst(enemy, count) {
  if (!enemy || enemy.hp <= 0) return;
  const angle = Math.atan2(state.player.y - enemy.y, state.player.x - enemy.x);
  const spacing = count === 5 ? 0.16 : 0.19;
  for (let index = 0; index < count; index += 1) {
    const spread = (index - (count - 1) / 2) * spacing;
    state.enemyShots.push({
      x: enemy.x, y: enemy.y,
      vx: Math.cos(angle + spread) * 390, vy: Math.sin(angle + spread) * 390,
      r: 8, life: 3, damage: 1,
    });
  }
}

function updateAlexPattern(enemy, dt) {
  enemy.alexPoseTime = Math.max(0, (enemy.alexPoseTime || 0) - dt);
  if (enemy.alexJump) {
    enemy.alexJump.timer -= dt;
    if (enemy.alexJump.timer <= 0) {
      enemy.x = enemy.alexJump.x;
      enemy.y = enemy.alexJump.y;
      if (distance(state.player, enemy) < 112 && state.player.invuln <= 0) hurtPlayer(2);
      enemy.alexJump = null;
      state.shake = 0.32;
    }
    return;
  }
  if (enemy.summon > 0) return;
  const phaseTwo = enemy.hp <= enemy.maxHp * 0.5;
  enemy.attackStep = ((enemy.attackStep || 0) + 1) % 3;
  enemy.summon = phaseTwo ? 1.15 + Math.random() * 0.45 : 1.75 + Math.random() * 0.65;
  const angle = Math.atan2(state.player.y - enemy.y, state.player.x - enemy.x);
  if (enemy.attackStep === 0) {
    enemy.alexJump = { x: state.player.x, y: state.player.y, timer: phaseTwo ? 0.72 : 0.95 };
    return;
  }
  enemy.alexPose = enemy.attackStep === 1 ? "open" : "pout";
  enemy.alexPoseTime = 0.58;
  const spreads = enemy.attackStep === 1 ? [-0.48, -0.24, 0, 0.24, 0.48] : [-0.16, 0, 0.16];
  const speed = enemy.attackStep === 1 ? 285 : 350;
  for (const spread of spreads) {
    state.enemyShots.push({
      x: enemy.x,
      y: enemy.y,
      vx: Math.cos(angle + spread) * speed,
      vy: Math.sin(angle + spread) * speed,
      r: enemy.attackStep === 1 ? 9 : 7,
      life: 3,
      damage: enemy.damage || 1,
    });
  }
}

function updateSamuPattern(enemy) {
  if (enemy.summon > 0) return;
  const hpRatio = enemy.hp / enemy.maxHp;
  const phase = hpRatio <= 0.25 ? 3 : hpRatio <= 0.6 ? 2 : 1;
  enemy.attackStep = ((enemy.attackStep || 0) + 1) % 7;
  enemy.summon = phase === 3 ? 1.12 : phase === 2 ? 1.42 : 1.78;
  if (enemy.attackStep === 0 || enemy.attackStep === 6) {
    placeSamuBlocks(phase === 1 ? 3 : 5);
    return;
  }
  if (enemy.attackStep === 1 || enemy.attackStep === 3) {
    throwSamuPickaxe(enemy, phase);
    return;
  }
  if (enemy.attackStep === 2 || enemy.attackStep === 5) {
    summonSamuEnderman(enemy, phase === 1 ? 1 : 2);
    return;
  }
  placeSamuWall(phase);
}

function placeSamuBlocks(count) {
  let placed = 0;
  for (let tries = 0; tries < 20 && placed < count; tries += 1) {
    if (addMinecraftBlock(220 + Math.random() * (WIDTH - 440), 170 + Math.random() * (HEIGHT - 330), 4.6)) placed += 1;
  }
}

function placeSamuWall(phase) {
  const vertical = Math.random() < 0.5;
  const gap = randomInt(1, phase === 3 ? 3 : 4);
  for (let i = 0; i < 5; i += 1) {
    if (i === gap) continue;
    const x = vertical ? WIDTH / 2 : 310 + i * 164;
    const y = vertical ? 180 + i * 92 : HEIGHT / 2;
    addMinecraftBlock(x, y, phase === 3 ? 5 : 4.2);
  }
}

function throwSamuPickaxe(enemy, phase) {
  const angle = Math.atan2(state.player.y - enemy.y, state.player.x - enemy.x);
  const speed = phase === 3 ? 520 : phase === 2 ? 470 : 420;
  state.enemyShots.push({
    x: enemy.x,
    y: enemy.y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r: 18,
    life: 6,
    damage: 1,
    sprite: "minecraftPickaxe",
    minecraftPickaxe: true,
    boomerang: true,
    owner: enemy,
    age: 0,
    returnAfter: phase === 3 ? 0.72 : phase === 2 ? 0.9 : 1.08,
  });
}

function summonSamuEnderman(boss, maxActive) {
  const active = state.enemies.filter((enemy) => enemy.pattern === "enderman").length + state.minecraftSummons.length;
  if (active >= maxActive) return;
  const angle = Math.random() * Math.PI * 2;
  const x = clamp(boss.x + Math.cos(angle) * 148, 132, WIDTH - 132);
  const y = clamp(boss.y + Math.sin(angle) * 118, 122, HEIGHT - 106);
  state.minecraftSummons.push({ x, y, life: 1, maxLife: 1 });
}

function spawnSamuEnderman(x, y) {
  state.enemies.push({
    x, y, r: 28, hp: 7, maxHp: 7, speed: 112, wobble: Math.random() * 10, shoot: 99, summon: 99,
    hit: 0, boss: false, finalBoss: false, damage: 1, name: "Enderman", tint: "rgba(112, 53, 158, 0.38)",
    canShoot: false, role: "tank", pattern: "enderman", sprite: "enemyEnderman", specialTimer: 99,
    specialPrompt: 0, specialReply: 0, stun: 0, chargeDelay: 0, rollVx: 0, rollVy: 0, teleportCooldown: 0.8,
  });
}

function shootVictorPattern(enemy, pattern) {
  if (pattern === 0) {
    shootVictorCrosses(enemy, 4, 430, 0, 1.75);
    return;
  }
  if (pattern === 1) {
    shootVictorCrosses(enemy, 4, 455, Math.PI / 4, 1.82);
    return;
  }
  if (pattern === 2) {
    const angleToPlayer = Math.atan2(state.player.y - enemy.y, state.player.x - enemy.x);
    for (const spread of [-0.34, -0.16, 0, 0.16, 0.34]) {
      addVictorCross(enemy, angleToPlayer + spread, 470, 1.9);
    }
    return;
  }
  shootVictorCrosses(enemy, 8, 445, enemy.wobble * 0.16, 1.85);
}

function shootVictorCrosses(enemy, count, speed, offset = 0, returnAfter = 1.82) {
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count + offset;
    addVictorCross(enemy, angle, speed, returnAfter);
  }
}

function addVictorCross(enemy, angle, speed, returnAfter) {
  state.enemyShots.push({
    x: enemy.x,
    y: enemy.y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r: 18,
    life: 6.2,
    damage: Math.max(1, enemy.damage || 1),
    sprite: "victorCross",
    boomerang: true,
    owner: enemy,
    age: 0,
    returnAfter,
  });
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
      name: isFinal ? "Eco" : isSalmon ? "SalmÃ³n flameado" : "Nigiri de atÃºn",
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
  if (effect.includes("daÃ±o") || effect.includes("dano")) {
    state.player.damage += effect.includes("%") ? 0.35 : 1;
  }
  if (effect.includes("velocidad")) {
    state.player.speed *= 1.1;
  }
  if (effect.includes("cadencia")) {
    state.player.fireDelay = Math.max(0.12, state.player.fireDelay * 0.9);
  }
  if (effect.includes("vida mÃ¡xima") || effect.includes("vida maxima")) {
    state.player.maxHp += 1;
    state.player.hp += 1;
  }
  if (effect.includes("daÃ±o recibido") || effect.includes("dano recibido") || effect.includes("defensa")) {
    state.player.damageReduction = Math.min(0.45, (state.player.damageReduction || 0) + 0.1);
  }
  if (effect.includes("crÃ­tico") || effect.includes("critico")) {
    state.player.critChance = Math.min(0.5, (state.player.critChance || 0) + 0.08);
  }
  if (effect.includes("daÃ±o de bombas") || effect.includes("dano de bombas")) {
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
      return true;
    case "silla-gamer":
      addMaxHp(2);
      return true;
    case "calcetin-sucio":
      player.speed *= 1.18;
      player.dirtyAura = 0.45;
      return true;
    case "hormiga":
      return true;
    case "hormiguero":
      return true;
    case "tecla":
      return true;
    case "llave-porsche":
      player.speed *= 1.15;
      return true;
    case "cable-mordido":
      return true;
    case "lijadora":
      return true;
    case "mando":
      return true;
    case "colacao":
      return true;
    case "setup":
      player.setupBoost = true;
      setTimeout(() => openSetupUpgradeMenu(), 0);
      return true;
    case "nigiri-salmon":
      return true;
    case "crep-chocolate":
      return true;
    case "palillos-chinos":
      return true;
    case "salsa-soja":
      return true;
    case "salsa-good-soup":
      return true;
    case "rasta-dani":
      return true;
    case "pegatina-perros":
      return true;
    case "talon":
      return true;
    case "perros-code":
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
  player.roomDamaged = true;
  player.paperCharge = 0;
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
    ["DaÃ±o", player.damage.toFixed(1)],
    ["Cadencia", `${(1 / player.fireDelay).toFixed(1)}/s`],
    ["Velocidad", Math.round(player.speed)],
    ["CrÃ­tico", `${Math.round((player.critChance || 0) * 100)}%`],
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
    empty.textContent = "TodavÃ­a no has pillado reliquias.";
    pauseRelics.appendChild(empty);
    return;
  }

  for (const item of player.items) {
    const relic = normalizeItem(item);
    const visual = relicVisual(relic);
    const cell = document.createElement("div");
    cell.className = `relic-cell relic-shape-${visual.shape}`;
    cell.tabIndex = 0;
    cell.style.setProperty("--relic-color", visual.color);
    cell.style.setProperty("--rarity-color", rarityColor(relic.rarity));
    const imageSrc = relic.image ? ASSETS[relic.image] : "";
    cell.innerHTML = imageSrc
      ? `${relicTooltip(relic)}<img class="relic-img" src="${imageSrc}" alt="">`
      : `${relicTooltip(relic)}<span class="relic-fallback">${visual.mark}</span>`;
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
  if (!collectionRelics || !collectionProgress || !recordsGrid) return;
  const discovered = new Set(save.discoveredRelics || []);
  const unlockedCount = RELIC_CATALOG.filter((item) => discovered.has(item.id)).length;
  collectionProgress.textContent = `${unlockedCount}/${RELIC_CATALOG.length} reliquias descubiertas`;
  const records = [
    ["Mejor sala", `${save.bestRoom || 0}/100`],
    ["Runs jugadas", save.runsPlayed || 0],
    ["Victorias", save.wins || 0],
    ["Muertes", save.deaths || 0],
    ["Bosses derrotados", save.bossesDefeated || 0],
    ["Monedas recogidas", save.totalCoins || 0],
    ["Llaves recogidas", save.totalKeys || 0],
    ["Bombas recogidas", save.totalBombs || 0],
  ];
  recordsGrid.innerHTML = records.map(([label, value]) => `<div class="record-row"><span>${label}</span><strong>${value}</strong></div>`).join("");
  collectionRelics.innerHTML = "";

  const rarityOrder = ["Poco comÃºn", "Rara", "Ã‰pica", "Legendaria", "MÃ­tica"];
  const sortedRelics = [...RELIC_CATALOG].sort((a, b) => rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity));
  let previousRarity = "";
  for (const item of sortedRelics) {
    const relic = normalizeItem(item);
    if (relic.rarity !== previousRarity) {
      const title = document.createElement("h2");
      title.className = "collection-rarity-title";
      title.textContent = relic.rarity;
      collectionRelics.appendChild(title);
      previousRarity = relic.rarity;
    }
    const unlocked = discovered.has(relic.id);
    const visual = relicVisual(relic);
    const cell = document.createElement("div");
    cell.className = `collection-cell relic-shape-${visual.shape} ${unlocked ? "unlocked" : "locked"}`;
    cell.style.setProperty("--relic-color", unlocked ? visual.color : "#020202");
    cell.style.setProperty("--rarity-color", rarityColor(relic.rarity));
    cell.tabIndex = unlocked ? 0 : -1;
    const imageSrc = relic.image ? ASSETS[relic.image] : "";
    const icon = imageSrc
      ? `<img class="collection-img" src="${imageSrc}" alt="">`
      : `<span>${unlocked ? visual.mark : ""}</span>`;
    cell.innerHTML = `${unlocked ? relicTooltip(relic) : ""}${icon}`;
    collectionRelics.appendChild(cell);
  }
}

function rarityColor(rarity) {
  const text = String(rarity || "").toLowerCase();
  if (text.includes("mÃ­tica") || text.includes("mitica")) return "#ff4fd8";
  if (text.includes("legend")) return "#ffd84a";
  if (text.includes("Ã©pica") || text.includes("epica")) return "#b56dff";
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
    if (debugUnlimitedMoney) debugUnlimitedMoney.checked = debugState.unlimitedMoney;
  }
}

function renderDebugRoomOptions() {
  if (!debugRoomSelect || !debugGoRoomBtn || !state) return;
  const currentRoom = state.room || 1;
  const previousSelection = Number(debugRoomSelect.value || debugState.selectedRoom || currentRoom);
  const selectedRoom = clamp(
    Number.isFinite(previousSelection) ? previousSelection : currentRoom,
    1,
    100,
  );
  debugRoomSelect.innerHTML = "";

  for (let room = 1; room <= 100; room += 1) {
    const option = document.createElement("option");
    option.value = room;
    option.textContent = `Sala ${room}`;
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
  if (!Number.isFinite(targetRoom) || targetRoom < 1 || targetRoom > 100) return;
  if (targetRoom === state.room) {
    debugState.panelOpen = false;
    renderDebugPanel();
    setMode("game");
    return;
  }
  state.room = targetRoom;
  state.debugLab = false;
  debugState.selectedRoom = targetRoom;
  state.player.invuln = 1.15;
  state.player.itemPose = 0;
  state.player.heldItem = null;
  spawnRoom();
  placePlayerAtEntrance(null);
  saveCurrentRun();
  setMode("game");
}

function enterDebugLab() {
  if (!state) return;
  state.debugLab = true;
  debugState.panelOpen = false;
  spawnRoom();
  setMode("game");
}

function spawnDebugEnemy() {
  if (!state?.debugLab) return;
  const hp = 18 + state.enemies.length * 3;
  state.enemies.push({
    x: WIDTH / 2 + (Math.random() - 0.5) * 420,
    y: HEIGHT / 2 + (Math.random() - 0.5) * 180,
    r: 30,
    hp,
    maxHp: hp,
    speed: 78,
    wobble: Math.random() * 10,
    shoot: 1.4,
    summon: 99,
    hit: 0,
    boss: false,
    finalBoss: false,
    tint: "rgba(205, 72, 64, 0.35)",
    canShoot: true,
    specialTimer: 99,
    specialPrompt: 0,
    specialReply: 0,
    stun: 0,
    chargeDelay: 0,
    damage: 1,
  });
}

function relicDescription(item) {
  const parts = [
    item.name,
    `${item.rarity || "Reliquia"} Â· ${item.type || "Objeto"}`,
    item.effect || "",
    item.penalty ? String(item.penalty) : "",
  ].filter(Boolean);
  return parts.join(" | ");
}

function relicTooltip(item) {
  return `<span class="relic-tooltip"><strong>${item.name}</strong><span>${item.effect || "Sin efecto"}</span></span>`;
}


// Loading helpers stay with core gameplay because they use ASSETS and balanceData.
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
