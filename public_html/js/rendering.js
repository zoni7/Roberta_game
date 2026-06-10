function render() {
  ctx.save();
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  if (mode === "loading") {
    ctx.fillStyle = "#070303";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawCenteredText("Cargando...", WIDTH / 2, HEIGHT / 2, 44, "#f5dcc9");
  }

  if (mode === "menu" || mode === "auth") {
    renderMenu();
  }

  if (mode === "mainmenu") {
    renderMainMenu();
  }

  if (mode === "stats" || mode === "options") {
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
    drawContain(images[item.image], item.bounds.x, item.bounds.y, item.bounds.w, item.bounds.h);
    ctx.globalAlpha = 1;}

  ctx.restore();
}

function renderGame() {
  if (state?.shake && options.screenShake) {
    const amount = state.shake * 35;
    ctx.translate((Math.random() - 0.5) * amount, (Math.random() - 0.5) * amount);
  }

  drawCover(getRoomImage(state.roomProfile), 0, 0, WIDTH, HEIGHT);
  drawThemeOverlay(state.roomProfile);
  drawRoomProps(state.roomProfile);
  drawRoomDarkness();
  drawDoors(state.roomProfile);
  drawBossHealthBar();
  drawRelicEntities();

  for (const chest of state.chests) {
    drawChest(chest);
  }

  drawShopItems();

  for (const zone of state.discoZones) drawDiscoZone(zone);
  for (const trap of state.tangleTraps || []) drawTangleTrap(trap);

  for (const block of state.minecraftBlocks) {
    const sprite = images.minecraftBlock;
    if (sprite?.complete && sprite.naturalWidth > 0) drawImagePixel(sprite, block.x - 42, block.y - 42, 84, 84);
  }

  for (const summon of state.minecraftSummons) {
    ctx.save();
    ctx.globalAlpha = 0.35 + Math.sin(summon.life * 24) * 0.15;
    ctx.fillStyle = "#8f42cc";
    ctx.beginPath();
    ctx.ellipse(summon.x, summon.y, 40, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  for (const enemy of state.enemies) {
    if (!enemy.alexJump) continue;
    const pulse = 0.35 + Math.sin(enemy.alexJump.timer * 26) * 0.16;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = "#da2d24";
    ctx.strokeStyle = "#ffe096";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(enemy.alexJump.x, enemy.alexJump.y, 68, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

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
    const size = (enemy.pattern === "xavi" ? 116 : enemy.finalBoss ? 164 : enemy.boss ? 124 : 62) + Math.sin(enemy.wobble) * (enemy.boss ? 5 : 3);
    ctx.globalAlpha = enemy.hit > 0 ? 0.65 : 1;
    const spriteKey = enemy.pattern === "alex" && enemy.alexPose === "open" && enemy.alexPoseTime > 0
      ? "bossAlexOpen"
      : enemy.pattern === "daniRastas" && enemy.hp < enemy.maxHp * 0.5
        ? "bossDaniNoRastas"
        : enemy.sprite;
    const sprite = spriteKey ? images[spriteKey] : null;
    if (sprite?.complete && sprite.naturalWidth > 0) {
      if (enemy.pattern === "xavi" && enemy.jumpFlip) drawImagePixelFlipped(sprite, enemy.x - size / 2, enemy.y - size / 2, size, size);
      else drawImagePixel(sprite, enemy.x - size / 2, enemy.y - size / 2, size, size);
    } else {
      drawTintedImage(images.slime, enemy.x - size / 2, enemy.y - size / 2, size, size, enemy.tint);
    }
    ctx.globalAlpha = 1;
    if (enemy.pattern === "creeper" && enemy.creeperFuse > 0) {
      const pulse = 0.45 + Math.sin(enemy.creeperFuse * 34) * 0.18;
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = "#ffdf76";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.r + 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (enemy.specialPrompt > 0) {
      const alpha = clamp(enemy.specialPrompt / 1.7, 0.18, 1);
      drawSpeechText("QUE?", enemy.x, enemy.y - enemy.r - 34, alpha, "#ffe098");
    } else if (enemy.specialReply > 0) {
      drawSpeechText("QUE POR QUE NO TE CALLAS!", enemy.x, enemy.y - enemy.r - 34, 1, "#ffe098", 16);
    }
  }

  for (const shot of state.shots) {
    drawProjectile(shot, "#9de8ff", "#327991");
  }

  for (const shot of state.enemyShots) {
    drawProjectile(shot, "#fa6868", "#651b1b");
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

function drawProjectile(shot, fill, stroke) {
  const projectileSprite = shot.sprite ? images[shot.sprite] : null;
  if (projectileSprite?.complete && projectileSprite.naturalWidth > 0) {
    const angle = shot.angle || Math.atan2(shot.vy || 0, shot.vx || 1);
    let length = shot.r * 4.4;
    let height = shot.r * 2.5;
    if (shot.sprite === "scyllaLobo") {
      length = shot.r * 6.6;
      height = shot.r * 2.4;
    } else if (shot.sprite === "projectileRifleBullet") {
      length = shot.r * 6.2;
      height = shot.r * 2.4;
    } else if (shot.sprite === "projectileShuriken") {
      length = shot.r * 3.6;
      height = shot.r * 3.6;
    } else if (shot.sprite === "projectilePlayerBlue" || shot.sprite === "projectileMagicPurple") {
      length = shot.r * 4.9;
      height = shot.r * 2.9;
    }
    ctx.save();
    ctx.translate(shot.x, shot.y);
    ctx.rotate(angle);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(projectileSprite, -length / 2, -height / 2, length, height);
    ctx.restore();
    return;
  }
  drawTear(shot.x, shot.y, fill, stroke, shot.r);
}

function drawPlayer() {
  const player = state.player;
  let sprite = images.playerFront;

  if (player.dead) sprite = images.playerDead;
  else if (player.tangled > 0) sprite = images.playerTangled;
  else if (player.flashPose > 0 || player.paralysis > 0) sprite = images.playerFlashed;
  else if (player.itemPose > 0) sprite = images.playerItem;
  else if (options.screenFlashes && player.hitFlash > 0 && Math.floor(player.hitFlash * 22) % 2 === 0) sprite = images.playerHit;
  else if (player.facing === "left") sprite = images.playerLeft;
  else if (player.facing === "right") sprite = images.playerRight;

  const size = player.itemPose > 0 ? 86 : 78;
  drawImagePixel(sprite, player.x - size / 2, player.y - size / 2 - 10, size, size);
  if (player.tangled > 0 && (player.tangleHint || 0) > 0) {
    drawSpeechText(`E ${player.tanglePresses || 0}/10`, player.x, player.y - 78, 1, "#f7dfc9", 18);
  }
  if (state.message === "LO QUE?" && state.messageTime > 0) {
    drawSpeechText("LO QUE?", player.x, player.y - 76, 1, "#f7dfc9");
  }

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

function drawRelicEntities() {
  for (const trail of state.toxicTrails) {
    ctx.save();
    ctx.globalAlpha = clamp(trail.life / trail.maxLife, 0, 0.58);
    ctx.fillStyle = "#8f9f38";
    ctx.beginPath();
    ctx.ellipse(trail.x, trail.y, trail.r, trail.r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  for (const ant of state.allies) {
    ctx.save();
    ctx.translate(ant.x, ant.y);
    ctx.fillStyle = "#120d0b";
    for (const offset of [-7, 0, 7]) {
      ctx.beginPath();
      ctx.arc(offset, 0, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "#120d0b";
    ctx.lineWidth = 2;
    for (const side of [-1, 1]) {
      for (const offset of [-5, 0, 5]) {
        ctx.beginPath();
        ctx.moveTo(offset, side * 2);
        ctx.lineTo(offset - 6, side * 9);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  const rasta = state.player.rastaOrbit;
  if (rasta) {
    ctx.save();
    ctx.translate(rasta.x, rasta.y);
    ctx.rotate(state.player.rastaAngle || 0);
    ctx.strokeStyle = "#100d0d";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-17, 0);
    ctx.quadraticCurveTo(-2, -8, 17, 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawSpeechText(text, x, y, alpha = 1, color = "#ffe098", size = 20) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `900 ${size}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#160706";
  ctx.fillStyle = color;
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
  ctx.restore();
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

  if (profile.type === "chestRoom" || profile.type === "woodChest" || profile.type === "silverChest" || profile.type === "goldChest" || profile.type === "madShop" || profile.type === "healerRoom" || profile.type === "sacrificeRoom") {
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
  if (state?.roomProfile?.type !== "madShop" && state?.roomProfile?.type !== "healerRoom") return;
  const x = WIDTH / 2;
  const y = HEIGHT / 2 - 50;
  const isHealer = state.roomProfile.type === "healerRoom";
  const merchant = isHealer ? images.healerCesc : merchantMenuOpen ? images.merchantOpen : images.merchantClosed;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.32)";
  ctx.beginPath();
  ctx.ellipse(x, y + 92, 92, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  drawImagePixel(merchant, x - 92, y - 92, 184, 184);
  if ((isHealer ? nearHealer() && !healerMenuOpen : nearMerchant() && !merchantMenuOpen)) {
    ctx.fillStyle = "#f8edd3";
    ctx.strokeStyle = "#160807";
    ctx.lineWidth = 7;
    ctx.font = "900 36px Arial, Helvetica, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeText("E", x, y - 112);
    ctx.fillText("E", x, y - 112);
  }
  if (isHealer) {
    ctx.font = "900 24px Arial, Helvetica, sans-serif";
    ctx.fillStyle = "#ff8585";
    ctx.strokeStyle = "#160807";
    ctx.lineWidth = 6;
    ctx.strokeText("CESC", x, y + 136);
    ctx.fillText("CESC", x, y + 136);
  }
  ctx.restore();
}

function drawChest(chest) {
  const y = chest.y + Math.sin(chest.bob) * 3;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.34)";
  ctx.beginPath();
  ctx.ellipse(chest.x, chest.y + 34, 46, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  const sprite = getChestSprite(chest);
  if (sprite?.complete && sprite.naturalWidth > 0) {
    drawImagePixel(sprite, chest.x - 56, y - 56, 112, 112);
  }

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

function getChestSprite(chest) {
  if (chest.chestType === "silverChest") return chest.opened ? images.chestSilverOpen : images.chestSilverClosed;
  if (chest.chestType === "goldChest") return chest.opened ? images.chestGoldOpen : images.chestGoldClosed;
  return chest.opened ? images.chestWoodOpen : images.chestWoodClosed;
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
    const imageSize = size * 0.92;
    ctx.shadowColor = rarityColor(relic.rarity);
    ctx.shadowBlur = Math.max(5, size * 0.14);
    drawImagePixel(image, -imageSize / 2, -imageSize / 2, imageSize, imageSize);
    ctx.shadowBlur = Math.max(2, size * 0.05);
    drawImagePixel(image, -imageSize / 2, -imageSize / 2, imageSize, imageSize);
    ctx.shadowBlur = 0;
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
  return state?.enemies?.find((enemy) => enemy.boss || enemy.pattern === "xavi") || null;
}

function drawImagePixel(img, x, y, w, h) {
  if (!img?.complete) return;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function drawImagePixelFlipped(img, x, y, w, h) {
  if (!img?.complete) return;
  ctx.save();
  ctx.translate(x + w, y);
  ctx.scale(-1, 1);
  ctx.drawImage(img, 0, 0, w, h);
  ctx.restore();
}

function drawDiscoZone(zone) {
  if (zone.kind === "scyllaCrush") {
    ctx.save();
    const warning = zone.warning > 0;
    const pulse = warning ? 0.55 + Math.sin(performance.now() * 0.014) * 0.12 : 1;
    ctx.globalAlpha = warning ? 0.26 * pulse : 0.62;
    ctx.fillStyle = warning ? "#7f4dff" : "#d8c7ff";
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.radius || 90, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = warning ? 0.72 : 0.95;
    ctx.strokeStyle = warning ? "#d8c7ff" : "#ffffff";
    ctx.lineWidth = warning ? 4 : 7;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.radius || 90, 0, Math.PI * 2);
    ctx.stroke();
    if ((zone.blast || 0) > 0) {
      const alpha = Math.min(0.74, (zone.blast || 0) / 0.34);
      const radius = (zone.radius || 90) + (1 - alpha) * 58;
      const gradient = ctx.createRadialGradient(zone.x, zone.y, 8, zone.x, zone.y, radius);
      gradient.addColorStop(0, `rgba(230,214,255,${0.68 * alpha})`);
      gradient.addColorStop(0.45, `rgba(139,76,255,${0.46 * alpha})`);
      gradient.addColorStop(1, "rgba(139,76,255,0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }
  ctx.save();
  ctx.translate(zone.x, zone.y);
  ctx.rotate(zone.angle);
  const length = zone.length || 1000;
  if (zone.kind === "xaviLaser") {
    ctx.globalAlpha = zone.warning > 0 ? 0.30 : 0.92;
    if (zone.warning > 0 || !images.xaviRay?.complete) {
      ctx.fillStyle = "#ff3d48";
      ctx.fillRect(0, -12, length, 24);
    } else {
      ctx.drawImage(images.xaviRay, 0, -18, length, 36);
    }
  } else if (zone.kind === "ferriAwp") {
    const following = (zone.follow || 0) > 0;
    const firing = zone.triggered && (zone.blast || 0) > 0;
    ctx.globalAlpha = firing ? 0.95 : following ? 0.36 : 0.72;
    ctx.fillStyle = firing ? "#fff2b0" : "#ff1f2f";
    ctx.fillRect(0, -(zone.width || 18) / 2, length, zone.width || 18);
    ctx.globalAlpha *= 0.45;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, -2, length, 4);
  } else {
    ctx.globalAlpha = zone.warning > 0 ? 0.18 : 0.52;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, -(zone.width || 160) / 2, length, zone.width || 160);
  }
  ctx.restore();
  if (zone.kind === "ferriAwp" && (zone.blast || 0) > 0) {
    ctx.save();
    const alpha = Math.min(0.75, (zone.blast || 0) / 0.22);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(255, 230, 120, 0.16)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.restore();
  }
  if (zone.kind === "jajoFlash" && (zone.blast || 0) > 0) {
    ctx.save();
    const alpha = Math.min(0.86, (zone.blast || 0) / 0.28);
    const radius = 170 + (1 - alpha) * 280;
    const gradient = ctx.createRadialGradient(zone.x, zone.y, 16, zone.x, zone.y, radius);
    gradient.addColorStop(0, `rgba(255,255,255,${0.72 * alpha})`);
    gradient.addColorStop(0.35, `rgba(255,244,214,${0.42 * alpha})`);
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.22 * alpha;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.restore();
  }
  if (zone.kind === "scyllaCrush" && (zone.blast || 0) > 0) {
    ctx.save();
    const alpha = Math.min(0.74, (zone.blast || 0) / 0.34);
    const radius = (zone.radius || 90) + (1 - alpha) * 58;
    const gradient = ctx.createRadialGradient(zone.x, zone.y, 8, zone.x, zone.y, radius);
    gradient.addColorStop(0, `rgba(230,214,255,${0.68 * alpha})`);
    gradient.addColorStop(0.45, `rgba(139,76,255,${0.46 * alpha})`);
    gradient.addColorStop(1, "rgba(139,76,255,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawTangleTrap(trap) {
  const alpha = Math.min(1, trap.life / 1.2);
  ctx.save();
  ctx.globalAlpha = 0.72 * alpha;
  ctx.translate(trap.x, trap.y);
  if (images.rastaTangle?.complete && images.rastaTangle.naturalWidth > 0) {
    drawImagePixel(images.rastaTangle, -54, -38, 108, 76);
    ctx.restore();
    return;
  }
  ctx.strokeStyle = "#161412";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  for (let i = 0; i < 7; i += 1) {
    const angle = (i / 7) * Math.PI * 2;
    const rx = Math.cos(angle) * 34;
    const ry = Math.sin(angle) * 18;
    ctx.beginPath();
    ctx.ellipse(rx * 0.25, ry * 0.2, 32 + i * 2, 13 + (i % 2) * 5, angle, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.strokeStyle = "#34302c";
  ctx.lineWidth = 3;
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.moveTo(-42 + i * 18, -12);
    ctx.quadraticCurveTo(-10 + i * 8, 10 + i * 2, 40 - i * 14, 18);
    ctx.stroke();
  }
  ctx.restore();
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
  return MAIN_MENU_ITEMS.find((item) => item.enabled() && isPointInsideBounds(item.bounds, point)) || null;
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
