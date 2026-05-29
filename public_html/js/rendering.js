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
