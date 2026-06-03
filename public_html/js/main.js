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
  setMode("mainmenu");
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
    if (merchantMenuOpen) closeMerchantMenu();
    else if (healerMenuOpen) closeHealerMenu();
    else if (mode === "game") pauseGame();
    else if (mode === "paused") resumeGame();
    else if (mode === "stats" || mode === "options") showMainMenu();
    return;
  }

  keys.add(event.code);

  if (mode === "game" && event.code === "KeyE") {
    if (openMerchantMenu()) return;
    if (openHealerMenu()) return;
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
  if (mode === "game" && clickFerriPrompt()) return;
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
      if (item.id === "options") showOptionsMenu();
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

for (const control of [masterVolume, musicVolume, effectsVolume, muteAudio, screenShake, screenFlashes, damageNumbers, highContrast]) {
  control?.addEventListener("input", () => {
    options[control.id] = control.type === "checkbox" ? control.checked : Number(control.value);
    renderOptions();
  });
}

fullscreenBtn?.addEventListener("click", async () => {
  if (document.fullscreenElement) await document.exitFullscreen();
  else await document.documentElement.requestFullscreen();
  renderOptions();
});

document.addEventListener("fullscreenchange", () => {
  if (mode === "options") renderOptions();
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
  setMode("menu");
  requestAnimationFrame(loop);
});
