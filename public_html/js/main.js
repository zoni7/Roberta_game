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
  SFX.init();
  setMode("menu");
  requestAnimationFrame(loop);
});
