function loadSave() {
  try {
    const parsed = {
      bestRoom: 0,
      totalCoins: 0,
      totalKeys: 0,
      totalBombs: 0,
      runsPlayed: 0,
      deaths: 0,
      wins: 0,
      bossesDefeated: 0,
      unlockedBlackHeart: false,
      discoveredRelics: [],
      currentRun: null,
      ...JSON.parse(localStorage.getItem(SAVE_KEY) || "{}"),
    };
    if (!Array.isArray(parsed.discoveredRelics)) parsed.discoveredRelics = [];
    return parsed;
  } catch {
    return { bestRoom: 0, totalCoins: 0, totalKeys: 0, totalBombs: 0, runsPlayed: 0, deaths: 0, wins: 0, bossesDefeated: 0, unlockedBlackHeart: false, discoveredRelics: [], currentRun: null };
  }
}

function writeSave() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

function loadOptions() {
  try {
    return { ...DEFAULT_OPTIONS, ...JSON.parse(localStorage.getItem(OPTIONS_KEY) || "{}") };
  } catch {
    return { ...DEFAULT_OPTIONS };
  }
}

function writeOptions() {
  localStorage.setItem(OPTIONS_KEY, JSON.stringify(options));
  document.body.classList.toggle("high-contrast", options.highContrast);
}

function renderOptions() {
  if (!optionsMenu) return;
  const controls = { masterVolume, musicVolume, effectsVolume, muteAudio, screenShake, screenFlashes, damageNumbers, highContrast };
  for (const [key, control] of Object.entries(controls)) {
    if (!control) continue;
    if (control.type === "checkbox") control.checked = Boolean(options[key]);
    else control.value = options[key];
  }
  document.querySelector("#masterVolumeValue").textContent = `${options.masterVolume}%`;
  document.querySelector("#musicVolumeValue").textContent = `${options.musicVolume}%`;
  document.querySelector("#effectsVolumeValue").textContent = `${options.effectsVolume}%`;
  if (fullscreenBtn) fullscreenBtn.textContent = document.fullscreenElement ? "Salir de pantalla completa" : "Pantalla completa";
  writeOptions();
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
      paralysis: 0,
      dirtyAura: snapshot?.player?.dirtyAura || 0,
      talonEvery: snapshot?.player?.talonEvery || 0,
      shotCounter: snapshot?.player?.shotCounter || 0,
      paperCharge: snapshot?.player?.paperCharge || 0,
      roomDamaged: false,
      perfectRooms: snapshot?.player?.perfectRooms || 0,
      fightRooms: snapshot?.player?.fightRooms || 0,
      bossesWithPorsche: snapshot?.player?.bossesWithPorsche || 0,
      talonKills: snapshot?.player?.talonKills || 0,
      setupRelicId: snapshot?.player?.setupRelicId || null,
      autoShotTimer: 0,
      roomTime: 0,
      items: Array.isArray(snapshot?.player?.items) ? snapshot.player.items.map(normalizeItem) : [],
    },
    enemies: [],
    shots: [],
    enemyShots: [],
    damageNumbers: [],
    allies: [],
    toxicTrails: [],
    minecraftBlocks: [],
    minecraftSummons: [],
    discoZones: [],
    pickups: [],
    chests: [],
    shopItems: [],
    debugLab: false,
    roomProfile: null,
    coins: snapshot?.coins || 0,
    keys: snapshot?.keys || 0,
    bombs: snapshot?.bombs || 0,
    chestRoomHistory: Array.isArray(snapshot?.chestRoomHistory) ? snapshot.chestRoomHistory : [],
    cleared: false,
    message: "",
    messageTime: 0,
    shake: 0,
  };

  state.player.hp = Math.min(state.player.hp, state.player.maxHp);
}

function newRun() {
  createRunState();
  save.runsPlayed = (save.runsPlayed || 0) + 1;
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
    chestRoomHistory: state.chestRoomHistory,
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
      paperCharge: state.player.paperCharge,
      perfectRooms: state.player.perfectRooms,
      fightRooms: state.player.fightRooms,
      bossesWithPorsche: state.player.bossesWithPorsche,
      talonKills: state.player.talonKills,
      setupRelicId: state.player.setupRelicId,
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

options = loadOptions();
save = loadSave();
