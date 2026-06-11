let introFinished = false;
let introFallbackTimer = null;

function updateFullscreenToggle() {
  if (!fullscreenToggleBtn) return;
  fullscreenToggleBtn.textContent = document.fullscreenElement ? "EXIT" : "FULL";
}

function updateMusicToggle() {
  if (!musicToggleBtn) return;
  const vol = options?.musicVolume ?? 100;
  musicToggleBtn.value = vol;
  const hudIcon = document.getElementById("hudMusicIcon");
  if (hudIcon) hudIcon.textContent = vol > 0 ? "🎵" : "🔇";
}

function handleHudMusicInput() {
  if (!options) return;
  options.musicVolume = Number(musicToggleBtn.value);
  updateMusicToggle();
  writeOptions();
  if (typeof SFX !== "undefined") SFX.updateVolumes();
  if (typeof renderOptions === "function") renderOptions(); // Sync with options menu
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch {
    // Fullscreen must come from a trusted browser interaction.
  }
  updateFullscreenToggle();
}

function finishIntro() {
  if (introFinished) return;
  introFinished = true;
  if (introFallbackTimer) {
    clearTimeout(introFallbackTimer);
    introFallbackTimer = null;
  }
  if (introVideo) {
    introVideo.pause();
    introVideo.currentTime = 0;
  }
  setMode("menu");
}

function playIntro() {
  if (!introScreen || !introVideo) {
    finishIntro();
    return;
  }
  introFinished = false;
  setMode("intro");
  introVideo.muted = Boolean(options?.muteAudio);
  introVideo.volume = clamp((options?.masterVolume ?? 85) / 100, 0, 1);
  introFallbackTimer = setTimeout(() => {
    if (!introFinished && introVideo.readyState === 0 && (introVideo.error || introVideo.networkState === HTMLMediaElement.NETWORK_NO_SOURCE)) {
      finishIntro();
    }
  }, 1000);
  const playback = introVideo.play();
  if (playback?.catch) playback.catch(() => {});
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
  renderRankingPanel();
  renderProfilePanel();
  setMode("mainmenu");
  SFX.playMainMenuMusic();
}

function openEntryAfterPressStart() {
  const remembered = currentUser && accountStore?.users?.[currentUser];
  if (remembered || isGuest) showMainMenu();
  else setMode("auth");
}

function showStatsMenu(view = "stats") {
  keys.clear();
  mouse.down = false;
  statsViewMode = view;
  setMode("stats");
}

function showOptionsMenu() {
  keys.clear();
  mouse.down = false;
  setMode("options");
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
  showMainMenu();
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

  if (mode === "intro" && (event.code === "Enter" || event.code === "Space")) {
    finishIntro();
    return;
  }

  if (event.code === "Escape") {
    if (merchantMenuOpen) closeMerchantMenu();
    else if (healerMenuOpen) closeHealerMenu();
    else if (mode === "game") pauseGame();
    else if (mode === "paused") resumeGame();
    else if (mode === "stats" || mode === "options") showMainMenu();
    else if (mode === "mainmenu" && !profilePanel.hidden) profilePanel.hidden = true;
    else if (mode === "mainmenu" && !devMenu.hidden) devMenu.hidden = true;
    return;
  }

  keys.add(event.code);

  if (mode === "game" && event.code === "KeyE") {
    if (mashOutOfTangle()) return;
    if (openMerchantMenu()) return;
    if (openHealerMenu()) return;
    if (tryUseSacrifice()) return;
    tryOpenNearbyChest();
  }

  if (mode === "menu" && (event.code === "Enter" || event.code === "Space")) {
    openEntryAfterPressStart();
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

introSkipBtn?.addEventListener("click", () => finishIntro());
introVideo?.addEventListener("ended", () => finishIntro());
introVideo?.addEventListener("error", () => finishIntro());
introScreen?.addEventListener("pointerdown", (event) => {
  if (event.target === introSkipBtn) return;
  if (introVideo?.paused && !introFinished) {
    introVideo.play().catch(() => {});
  }
});
fullscreenToggleBtn?.addEventListener("click", () => toggleFullscreen());
musicToggleBtn?.addEventListener("input", () => handleHudMusicInput());

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
  if (mode === "game" && clickFerriPrompt()) return;
  mouse.down = true;
  canvas.setPointerCapture(event.pointerId);

  if (mode === "menu" && isOverMenuStart()) {
    openEntryAfterPressStart();
    return;
  }

  if (mode === "mainmenu") {
    const item = getMainMenuItemAtPointer();
    if (item?.enabled()) {
      if (item.id === "newRun") startFromMenu();
      if (item.id === "continue") continueFromMenu();
      if (item.id === "stats") showStatsMenu("stats");
      if (item.id === "relics") showStatsMenu("relics");
      if (item.id === "options") showOptionsMenu();
      if (item.id === "exit") setMode("menu");
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
gameOverMenuBtn?.addEventListener("click", () => showMainMenu());
victoryBtn.addEventListener("click", () => startFromMenu());
statsBackBtn?.addEventListener("click", () => showMainMenu());
optionsBackBtn?.addEventListener("click", () => showMainMenu());
resumeBtn.addEventListener("click", () => resumeGame());
pauseMenuBtn.addEventListener("click", () => backToMainMenuFromPause());
pauseNewRunBtn.addEventListener("click", () => startFromMenu());
merchantCloseBtn?.addEventListener("click", () => closeMerchantMenu());
healerCloseBtn?.addEventListener("click", () => closeHealerMenu());

loginBtn?.addEventListener("click", async () => {
  authMessage.textContent = "Loading...";
  const result = await loginUser(authUser.value, authPass.value, authRemember.checked);
  authMessage.textContent = result.message;
  if (result.ok) showMainMenu();
});

createAccountBtn?.addEventListener("click", async () => {
  authMessage.textContent = "Loading...";
  const result = await createAccount(authUser.value, authPass.value, authRemember.checked);
  authMessage.textContent = result.message;
  if (result.ok) showMainMenu();
});

guestBtn?.addEventListener("click", () => {
  loginGuest();
  showMainMenu();
});

profileButton?.addEventListener("click", () => {
  renderProfilePanel();
  profilePanel.hidden = false;
});

profileCloseBtn?.addEventListener("click", () => {
  profilePanel.hidden = true;
});

logoutBtn?.addEventListener("click", () => logoutUser());

devEntryBtn?.addEventListener("click", () => {
  devMenu.hidden = false;
  devLock.hidden = false;
  devTools.hidden = true;
  devPasswordInput.value = "";
  devPasswordInput.focus();
});

devCloseBtn?.addEventListener("click", () => {
  devMenu.hidden = true;
});

devUnlockBtn?.addEventListener("click", () => {
  if (devPasswordInput.value === "234567") {
    devLock.hidden = true;
    devTools.hidden = false;
    renderDeveloperPanel();
  }
});

devPasswordInput?.addEventListener("keydown", (event) => {
  if (event.code === "Enter") devUnlockBtn.click();
});

leaderboardEnabledToggle?.addEventListener("change", () => {
  accountStore.leaderboardEnabled = leaderboardEnabledToggle.checked;
  writeAccountStore();
  if (onlineReady && onlineToken) {
    apiRequest("set_leaderboard_enabled", { enabled: leaderboardEnabledToggle.checked }).catch(() => {});
  }
  renderRankingPanel();
});

exportDataBtn?.addEventListener("click", () => {
  if (onlineReady && onlineToken) {
    apiRequest("export_data").then((data) => {
      devDataBox.value = JSON.stringify(data.export, null, 2);
    }).catch((error) => {
      devDataBox.value = error.message;
    });
  } else {
    devDataBox.value = JSON.stringify(accountStore, null, 2);
  }
});

importDataBtn?.addEventListener("click", () => {
  try {
    const parsed = JSON.parse(devDataBox.value);
    accountStore = {
      users: parsed?.users && typeof parsed.users === "object" ? parsed.users : {},
      leaderboardEnabled: parsed?.leaderboardEnabled !== false,
    };
    writeAccountStore();
    renderDeveloperPanel();
    renderRankingPanel();
  } catch {
    devDataBox.value = "JSON invalido";
  }
});

resetRankingBtn?.addEventListener("click", () => {
  if (onlineReady && onlineToken) {
    apiRequest("reset_ranking").then(() => refreshOnlineLeaderboard()).catch(() => {});
  }
  for (const user of Object.values(accountStore.users)) {
    user.profile = normalizeProfile(user.profile, user.profile?.username || "User");
    user.profile.bestRoom = 0;
    user.profile.lastRun = null;
  }
  writeAccountStore();
  renderDeveloperPanel();
  renderRankingPanel();
});

devUsersList?.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const row = button.closest(".dev-user-row");
  const username = row?.dataset.user;
  const user = accountStore.users[username];
  if (!user) return;
  const action = button.dataset.action;
  if (action === "save-record") {
    user.profile.bestRoom = clamp(Number(row.querySelector('[data-action="room"]').value) || 0, 0, 100);
    if (onlineReady && onlineToken) apiRequest("edit_record", { username, bestRoom: user.profile.bestRoom }).then(() => refreshOnlineLeaderboard()).catch(() => {});
  }
  if (action === "delete-record") {
    user.profile.bestRoom = 0;
    user.profile.lastRun = null;
    if (onlineReady && onlineToken) apiRequest("delete_record", { username }).then(() => refreshOnlineLeaderboard()).catch(() => {});
  }
  if (action === "delete-user") {
    delete accountStore.users[username];
    if (onlineReady && onlineToken) apiRequest("delete_user", { username }).then(() => refreshOnlineLeaderboard()).catch(() => {});
    if (currentUser === username) logoutUser();
  }
  writeAccountStore();
  renderDeveloperPanel();
  renderRankingPanel();
});

for (const control of [masterVolume, musicVolume, effectsVolume, muteAudio, screenShake, screenFlashes, damageNumbers, highContrast]) {
  control?.addEventListener("input", () => {
    options[control.id] = control.type === "checkbox" ? control.checked : Number(control.value);
    renderOptions();
    if (typeof SFX !== "undefined") SFX.updateVolumes();
    updateMusicToggle();
  });
}

fullscreenBtn?.addEventListener("click", async () => {
  if (document.fullscreenElement) await document.exitFullscreen();
  else await document.documentElement.requestFullscreen();
  renderOptions();
});

document.addEventListener("fullscreenchange", () => {
  if (mode === "options") renderOptions();
  updateFullscreenToggle();
});

resetOptionsBtn?.addEventListener("click", () => {
  options = { ...DEFAULT_OPTIONS };
  renderOptions();
});

secretToolBtn?.addEventListener("click", () => {
  debugState.panelOpen = !debugState.panelOpen;
  renderDebugPanel();
  if (debugState.panelOpen && !debugState.unlocked) {
    debugCodeInput?.focus();
  }
});

debugCodeInput?.addEventListener("input", () => {
  debugCodeInput.value = debugCodeInput.value.replace(/\D/g, "").slice(0, 4);
  if (debugCodeInput.value === "2345") unlockDebugTools();
});

debugCodeInput?.addEventListener("keydown", (event) => {
  if (event.code === "Enter" && debugCodeInput.value === "2345") unlockDebugTools();
});

debugGoRoomBtn?.addEventListener("click", () => jumpToDebugRoom());
debugLabBtn?.addEventListener("click", () => enterDebugLab());
debugSpawnEnemyBtn?.addEventListener("click", () => spawnDebugEnemy());
debugHealBtn?.addEventListener("click", () => {
  if (!state) return;
  state.player.hp = state.player.maxHp;
  syncHud();
});
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
debugUnlimitedMoney?.addEventListener("change", () => {
  debugState.unlimitedMoney = debugUnlimitedMoney.checked;
  renderDebugPanel();
  if (merchantMenuOpen) renderMerchantMenu();
  if (healerMenuOpen) renderHealerMenu();
});

Promise.all([loadImages(), loadBalance()]).then(() => {
  if (typeof SFX !== "undefined") {
    SFX.init();
    SFX.updateVolumes();
  }
  detectOnlineApi();
  playIntro();
  updateFullscreenToggle();
  updateMusicToggle();
  requestAnimationFrame(loop);
});
