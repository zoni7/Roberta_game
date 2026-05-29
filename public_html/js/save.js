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
