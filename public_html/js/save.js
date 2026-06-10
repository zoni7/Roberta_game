const ACCOUNT_STORE_KEY = "binding-of-perros-accounts-v1";
const SESSION_KEY = "binding-of-perros-session-v1";
const ONLINE_API_URL = "api/index.php";
let onlineReady = false;
let onlineToken = null;
let onlineLeaderboard = [];
let lastOnlineSync = 0;

async function apiRequest(action, payload = {}) {
  const response = await fetch(ONLINE_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, token: onlineToken, ...payload }),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.message || "API error");
  onlineReady = true;
  return data;
}

async function detectOnlineApi() {
  try {
    const data = await apiRequest("ping");
    onlineReady = Boolean(data.ok);
    if (onlineToken) {
      try {
        const session = await apiRequest("session");
        currentUser = session.username || currentUser;
        isGuest = false;
        save = normalizeProfile(session.profile, currentUser);
        options = { ...DEFAULT_OPTIONS, ...(save.options || loadOptions()) };
        if (Array.isArray(session.leaderboard)) onlineLeaderboard = session.leaderboard;
        renderProfilePanel();
      } catch {
        onlineToken = null;
      }
    }
    await refreshOnlineLeaderboard();
  } catch {
    onlineReady = false;
  }
}

async function ensureOnlineApi() {
  if (onlineReady) return true;
  await detectOnlineApi();
  return onlineReady;
}

async function refreshOnlineLeaderboard() {
  if (!onlineReady) return;
  try {
    const data = await apiRequest("leaderboard");
    onlineLeaderboard = Array.isArray(data.leaderboard) ? data.leaderboard : [];
    renderRankingPanel();
  } catch {
    onlineReady = false;
  }
}

function rememberOnlineSession(username, token, remember = true) {
  onlineToken = token || null;
  if (token && remember) localStorage.setItem(SESSION_KEY, JSON.stringify({ username, token }));
  else localStorage.removeItem(SESSION_KEY);
}

function emptyProfile(username = "Guest") {
  return {
    username,
    bestRoom: 0,
    totalCoins: 0,
    totalKeys: 0,
    totalBombs: 0,
    keysUsed: 0,
    bombsUsed: 0,
    chestsOpened: 0,
    enemiesKilled: 0,
    runsPlayed: 0,
    deaths: 0,
    wins: 0,
    bossesDefeated: 0,
    unlockedBlackHeart: false,
    discoveredRelics: [],
    relicUseCounts: {},
    lastRun: null,
    currentRun: null,
    options: null,
  };
}

function normalizeUsername(value) {
  return String(value || "").trim().replace(/\s+/g, "_").slice(0, 24);
}

function normalizeProfile(profile, username = "Guest") {
  const merged = { ...emptyProfile(username), ...(profile || {}), username };
  if (!Array.isArray(merged.discoveredRelics)) merged.discoveredRelics = [];
  if (!merged.relicUseCounts || typeof merged.relicUseCounts !== "object") merged.relicUseCounts = {};
  return merged;
}

function hashPassword(value) {
  let hash = 2166136261;
  for (const char of String(value || "")) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function loadAccountStore() {
  try {
    const parsed = JSON.parse(localStorage.getItem(ACCOUNT_STORE_KEY) || "null");
    return {
      users: parsed?.users && typeof parsed.users === "object" ? parsed.users : {},
      leaderboardEnabled: parsed?.leaderboardEnabled !== false,
    };
  } catch {
    return { users: {}, leaderboardEnabled: true };
  }
}

function writeAccountStore() {
  localStorage.setItem(ACCOUNT_STORE_KEY, JSON.stringify(accountStore));
}

function loadSave() {
  accountStore = loadAccountStore();
  let session = null;
  try {
    session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    session = null;
  }
  if (session?.token) onlineToken = session.token;
  if (session?.username && accountStore.users[session.username]) {
    currentUser = session.username;
    isGuest = false;
    return normalizeProfile(accountStore.users[currentUser].profile, currentUser);
  }
  try {
    return normalizeProfile(JSON.parse(localStorage.getItem(SAVE_KEY) || "null"), "Guest");
  } catch {
    return emptyProfile();
  }
}

function writeSave() {
  save = normalizeProfile(save, currentUser || "Guest");
  save.options = options ? { ...options } : save.options;
  if (!isGuest && currentUser && accountStore?.users?.[currentUser]) {
    accountStore.users[currentUser].profile = save;
    writeAccountStore();
  } else {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  }
  syncOnlineProfile();
  renderRankingPanel();
  renderProfilePanel();
}

function syncOnlineProfile(force = false) {
  if (!onlineReady || !onlineToken || isGuest || !currentUser || !save) return;
  const now = Date.now();
  if (!force && now - lastOnlineSync < 1200) return;
  lastOnlineSync = now;
  apiRequest("save_profile", { profile: save })
    .then((data) => {
      if (Array.isArray(data.leaderboard)) onlineLeaderboard = data.leaderboard;
      renderRankingPanel();
    })
    .catch(() => {
      onlineReady = false;
    });
}

function loadOptions() {
  try {
    return { ...DEFAULT_OPTIONS, ...JSON.parse(localStorage.getItem(OPTIONS_KEY) || "{}") };
  } catch {
    return { ...DEFAULT_OPTIONS };
  }
}

function writeOptions() {
  if (save) save.options = { ...options };
  localStorage.setItem(OPTIONS_KEY, JSON.stringify(options));
  if (!isGuest && currentUser && accountStore?.users?.[currentUser]) {
    accountStore.users[currentUser].profile = normalizeProfile(save, currentUser);
    writeAccountStore();
  }
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
  if (fullscreenBtn) fullscreenBtn.textContent = document.fullscreenElement ? "Exit fullscreen" : "Fullscreen";
  writeOptions();
}

function hasCurrentRun() {
  return Boolean(save.currentRun && save.currentRun.room >= 1 && save.currentRun.room <= 100);
}

async function createAccount(username, password, remember = true) {
  username = normalizeUsername(username);
  if (!username || !password) return { ok: false, message: "Usuario y contrasena obligatorios." };
  if (await ensureOnlineApi()) {
    try {
      const data = await apiRequest("register", { username, password });
      currentUser = data.username || username;
      isGuest = false;
      save = normalizeProfile(data.profile, currentUser);
      options = { ...DEFAULT_OPTIONS, ...(save.options || loadOptions()) };
      rememberOnlineSession(currentUser, data.token, remember);
      writeSave();
      await refreshOnlineLeaderboard();
      return { ok: true, message: "OK online" };
    } catch (error) {
      return { ok: false, message: error.message || "No se pudo crear online." };
    }
  }
  if (accountStore.users[username]) return { ok: false, message: "Ese usuario ya existe." };
  accountStore.users[username] = {
    passwordHash: hashPassword(password),
    createdAt: Date.now(),
    profile: emptyProfile(username),
  };
  writeAccountStore();
  return loginUser(username, password, remember);
}

async function loginUser(username, password, remember = true) {
  username = normalizeUsername(username);
  if (!username || !password) return { ok: false, message: "Usuario y contrasena obligatorios." };
  if (await ensureOnlineApi()) {
    try {
      const data = await apiRequest("login", { username, password });
      currentUser = data.username || username;
      isGuest = false;
      save = normalizeProfile(data.profile, currentUser);
      options = { ...DEFAULT_OPTIONS, ...(save.options || loadOptions()) };
      rememberOnlineSession(currentUser, data.token, remember);
      writeOptions();
      writeSave();
      await refreshOnlineLeaderboard();
      return { ok: true, message: "OK online" };
    } catch (error) {
      return { ok: false, message: error.message || "Login online incorrecto." };
    }
  }
  const user = accountStore.users[username];
  if (!user || user.passwordHash !== hashPassword(password)) return { ok: false, message: "Login incorrecto." };
  currentUser = username;
  isGuest = false;
  save = normalizeProfile(user.profile, username);
  options = { ...DEFAULT_OPTIONS, ...(save.options || loadOptions()) };
  if (remember) localStorage.setItem(SESSION_KEY, JSON.stringify({ username }));
  else localStorage.removeItem(SESSION_KEY);
  writeOptions();
  writeSave();
  return { ok: true, message: "OK" };
}

function loginGuest() {
  currentUser = null;
  isGuest = true;
  onlineToken = null;
  localStorage.removeItem(SESSION_KEY);
  save = normalizeProfile(JSON.parse(localStorage.getItem(SAVE_KEY) || "null"), "Guest");
  options = { ...DEFAULT_OPTIONS, ...(save.options || loadOptions()) };
  writeOptions();
}

function logoutUser() {
  if (state) saveCurrentRun();
  currentUser = null;
  isGuest = false;
  onlineToken = null;
  localStorage.removeItem(SESSION_KEY);
  save = normalizeProfile(JSON.parse(localStorage.getItem(SAVE_KEY) || "null"), "Guest");
  setMode("menu");
}

function getLeaderboard() {
  if (onlineReady && onlineLeaderboard.length) {
    return onlineLeaderboard.map((row) => normalizeProfile(row, row.username));
  }
  if (!accountStore) return [];
  if (accountStore.leaderboardEnabled === false) return [];
  return Object.entries(accountStore.users)
    .map(([username, user]) => normalizeProfile(user.profile, username))
    .filter((profile) => profile.bestRoom > 0)
    .sort((a, b) => (b.bestRoom || 0) - (a.bestRoom || 0) || (b.bossesDefeated || 0) - (a.bossesDefeated || 0));
}

function updateProfileRecord(room, outcome = "run") {
  if (!save) return;
  const canUpdateRecord = isGuest || accountStore?.leaderboardEnabled !== false;
  if (canUpdateRecord) save.bestRoom = Math.max(save.bestRoom || 0, room || 0);
  save.lastRun = { room, outcome, at: Date.now(), relics: state?.player?.items?.map((item) => item.id) || [] };
  writeSave();
  syncOnlineProfile(true);
}

function renderRankingPanel() {
  if (!rankingList) return;
  const rows = getLeaderboard().slice(0, 10);
  if (accountStore?.leaderboardEnabled === false) {
    rankingList.innerHTML = `<p class="empty-ranking">Ranking disabled</p>`;
    return;
  }
  if (!rows.length) {
    rankingList.innerHTML = `<p class="empty-ranking">Sin records todavia</p>`;
    return;
  }
  rankingList.innerHTML = rows.map((row, index) => `
    <div class="ranking-row">
      <strong>#${index + 1}</strong>
      <span>${row.username}</span>
      <em>Sala ${row.bestRoom || 0}</em>
    </div>
  `).join("");
}

function renderProfilePanel() {
  if (!profileDetails) return;
  const discoveredCount = new Set(save?.discoveredRelics || []).size;
  const lastRun = save?.lastRun ? `Sala ${save.lastRun.room} - ${save.lastRun.outcome}` : "Sin runs";
  profileDetails.innerHTML = `
    <div><span>Usuario</span><strong>${isGuest ? "Guest" : currentUser || "Sin login"}</strong></div>
    <div><span>Mejor sala</span><strong>${save?.bestRoom || 0}</strong></div>
    <div><span>Runs jugadas</span><strong>${save?.runsPlayed || 0}</strong></div>
    <div><span>Muertes</span><strong>${save?.deaths || 0}</strong></div>
    <div><span>Bosses derrotados</span><strong>${save?.bossesDefeated || 0}</strong></div>
    <div><span>Reliquias</span><strong>${discoveredCount}/${RELIC_CATALOG.length}</strong></div>
    <div><span>Ultima run</span><strong>${lastRun}</strong></div>
  `;
}

function renderDeveloperPanel() {
  if (!devUsersList || !accountStore) return;
  if (leaderboardEnabledToggle) leaderboardEnabledToggle.checked = accountStore.leaderboardEnabled !== false;
  const users = Object.entries(accountStore.users);
  devUsersList.innerHTML = users.length ? users.map(([username, user]) => {
    const profile = normalizeProfile(user.profile, username);
    return `
      <div class="dev-user-row" data-user="${username}">
        <strong>${username}</strong>
        <label>Sala <input data-action="room" value="${profile.bestRoom || 0}" inputmode="numeric"></label>
        <button data-action="save-record">Save</button>
        <button data-action="delete-record">Delete record</button>
        <button data-action="delete-user">Delete user</button>
      </div>
    `;
  }).join("") : `<p class="empty-ranking">No hay usuarios.</p>`;
}

function createRunState(snapshot = null) {
  state = {
    runId: snapshot?.runId || `run-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
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
    tangleTraps: [],
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
  const clearedBossRoom = state.cleared && state.roomProfile?.type === "boss" && state.room < 100;
  const savedRoom = clearedBossRoom ? state.room + 1 : state.room;
  return {
    runId: state.runId,
    room: savedRoom,
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
  save.bestRoom = Math.max(save.bestRoom || 0, state.room || 0);
  writeSave();
}

function clearCurrentRun() {
  save.currentRun = null;
  writeSave();
}

options = loadOptions();
save = loadSave();
if (save?.options) options = { ...DEFAULT_OPTIONS, ...save.options };
