import { weaponStats } from "./data/weapons.js";
import { rewardColors, weaponUpgradeRequirementLine } from "./data/rewards.js";
import { loadSpriteImages, spriteSheets } from "./sprites.js";

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.dpr = 1;
    this.sprites = loadSpriteImages(spriteSheets);
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    this.dpr = 1;
    const width = Math.floor(window.innerWidth);
    const height = Math.floor(window.innerHeight);
    this.canvas.width = width;
    this.canvas.height = height;
  }

  render(game) {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    const camera = game.camera;
    const shake = game.combat.screenShake;
    const sx = shake ? (Math.random() - 0.5) * shake : 0;
    const sy = shake ? (Math.random() - 0.5) * shake : 0;

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.save();
    ctx.translate(-camera.x + sx, -camera.y + sy);
    this.drawRoom(ctx, game.stage);
    this.drawQuestTorches(ctx, game.stage);
    this.drawLoot(ctx, game.loot);
    this.drawIcePatches(ctx, game.combat.icePatches);
    this.drawNets(ctx, game.combat.nets);
    this.drawProjectiles(ctx, game.combat.projectiles);
    this.drawProjectiles(ctx, game.combat.enemyProjectiles);
    this.drawSlashes(ctx, game.combat.slashes);
    for (const enemy of game.enemies) {
      this.drawEnemy(ctx, enemy);
    }
    for (const player of game.players) {
      this.drawPets(ctx, player.pets);
    }
    for (const player of game.players) {
      this.drawPlayer(ctx, player);
    }
    this.drawFloaters(ctx, game.combat.floaters);
    this.drawSpeechBubbles(ctx, game.combat.speechBubbles);
    this.drawQuestFog(ctx, game);
    ctx.restore();

    this.drawHud(ctx, game);
    this.drawRewardChoices(ctx, game);
  }

  drawEllipse(ctx, x, y, radiusX, radiusY, rotation = 0, startAngle = 0, endAngle = Math.PI * 2) {
    if (typeof ctx.ellipse === "function") {
      ctx.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle);
      return;
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.scale(radiusX, radiusY);
    ctx.arc(0, 0, 1, startAngle, endAngle);
    ctx.restore();
  }

  drawRoundRect(ctx, x, y, width, height, radius) {
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(x, y, width, height, radius);
      return;
    }

    const r = Math.min(radius, width / 2, height / 2);
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
  }

  drawRoom(ctx, stage) {
    const { room } = stage;
    ctx.fillStyle = stage.theme.floor;
    ctx.fillRect(0, 0, room.width, room.height);

    ctx.fillStyle = stage.theme.tile;
    for (let x = room.margin; x < room.width - room.margin; x += 96) {
      for (let y = room.margin; y < room.height - room.margin; y += 96) {
        ctx.fillRect(x + 2, y + 2, 90, 90);
      }
    }

    ctx.strokeStyle = stage.isBoss ? "#a747d9" : stage.theme.wall;
    ctx.lineWidth = 12;
    ctx.strokeRect(room.margin - 20, room.margin - 20, room.width - room.margin * 2 + 40, room.height - room.margin * 2 + 40);

    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    for (let i = 0; i < 18; i += 1) {
      const x = room.margin + ((i * 167) % (room.width - room.margin * 2));
      const y = room.margin + ((i * 103) % (room.height - room.margin * 2));
      ctx.fillRect(x, y, 38, 14);
    }

    for (const obstacle of room.obstacles) {
      ctx.fillStyle = stage.theme.obstacle;
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h);
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      ctx.fillRect(obstacle.x + 8, obstacle.y + 8, obstacle.w - 16, 8);
      ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
      ctx.lineWidth = 3;
      ctx.strokeRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h);
    }
  }

  drawPlayer(ctx, player) {
    if (player.hp <= 0) {
      this.drawDownedPlayer(ctx, player);
      return;
    }

    if (this.drawPlayerSprite(ctx, player)) {
      this.drawPlayerAbilityEffects(ctx, player);
      this.drawPlayerLabel(ctx, player);
      return;
    }

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.facing);

    if (player.invulnerable > 0) {
      ctx.globalAlpha = 0.62 + Math.sin(performance.now() / 45) * 0.22;
    }

    ctx.fillStyle = player.character.color;
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = player.character.accent;
    ctx.beginPath();
    ctx.moveTo(player.radius + 12, 0);
    ctx.lineTo(5, -10);
    ctx.lineTo(5, 10);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#0d1013";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    this.drawPlayerAbilityEffects(ctx, player);
    this.drawPlayerLabel(ctx, player);
  }

  drawDownedPlayer(ctx, player) {
    ctx.save();
    ctx.globalAlpha = 0.52;
    ctx.fillStyle = player.character.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#101317";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(player.x - 12, player.y - 12);
    ctx.lineTo(player.x + 12, player.y + 12);
    ctx.moveTo(player.x + 12, player.y - 12);
    ctx.lineTo(player.x - 12, player.y + 12);
    ctx.stroke();
    ctx.restore();
    this.drawPlayerLabel(ctx, player);
  }

  drawPlayerLabel(ctx, player) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "900 12px ui-sans-serif, system-ui";
    ctx.fillStyle = player.playerIndex === 1 ? "#73a9ff" : "#f2b85b";
    ctx.fillText(player.label, player.x, player.y - player.radius - 36);
    ctx.restore();
  }

  drawPets(ctx, pets) {
    for (const pet of pets) {
      if (pet.x === undefined || pet.y === undefined) {
        continue;
      }
      ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
      ctx.beginPath();
      this.drawEllipse(ctx, pet.x, pet.y + 12, 13, 5);
      ctx.fill();
      ctx.fillStyle = pet.color;
      ctx.beginPath();
      ctx.arc(pet.x, pet.y, 10 + Math.sin(performance.now() / 160) * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f6f1e8";
      ctx.beginPath();
      ctx.arc(pet.x + 3, pet.y - 3, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }


  drawPlayerSprite(ctx, player) {
    const sheet = this.sprites[player.character.id];
    if (!sheet?.loaded) {
      return false;
    }

    const animationName = this.playerAnimationName(player);
    const animation = sheet.animations[animationName] ?? sheet.animations.idle;
    const frame = Math.floor(player.animationTime * animation.fps) % animation.frames;
    const sourceX = frame * sheet.frameWidth;
    const sourceY = animation.row * sheet.frameHeight;
    const drawX = Math.round(player.x - sheet.drawWidth / 2);
    const drawY = Math.round(player.y - sheet.drawHeight / 2 - 4);
    const facingLeft = Math.cos(player.facing) < -0.12;

    ctx.save();
    if (player.invulnerable > 0 || player.abilityState?.id === "whirlwindSmash") {
      ctx.globalAlpha = 0.76 + Math.sin(performance.now() / 45) * 0.18;
    }

    ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
    ctx.beginPath();
    this.drawEllipse(ctx, player.x, player.y + 24, 24, 8);
    ctx.fill();

    if (facingLeft) {
      ctx.translate(player.x, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(
        sheet.image,
        sourceX,
        sourceY,
        sheet.frameWidth,
        sheet.frameHeight,
        Math.round(-sheet.drawWidth / 2),
        drawY,
        sheet.drawWidth,
        sheet.drawHeight
      );
    } else {
      ctx.drawImage(
        sheet.image,
        sourceX,
        sourceY,
        sheet.frameWidth,
        sheet.frameHeight,
        drawX,
        drawY,
        sheet.drawWidth,
        sheet.drawHeight
      );
    }

    ctx.restore();
    return true;
  }

  playerAnimationName(player) {
    if (player.abilityState?.id === "whirlwindSmash") {
      return "whirlwind";
    }
    if (player.invulnerable > 0 && player.hp < player.maxHp) {
      return "hurt";
    }
    if (player.attackTimer > Math.max(0, player.weaponCooldown() - 0.18)) {
      return "attack";
    }
    if (player.isMoving) {
      return "walk";
    }
    return "idle";
  }

  drawPlayerAbilityEffects(ctx, player) {
    if (player.abilityState?.id !== "whirlwindSmash") {
      return;
    }

    const progress = 1 - player.abilityState.timer / player.abilityState.total;
    ctx.strokeStyle = `rgba(242, 184, 91, ${0.75 - progress * 0.2})`;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.abilityValue("pullRadius") * (0.72 + progress * 0.22), progress * 9, progress * 9 + Math.PI * 1.45);
    ctx.stroke();
  }

  drawEnemy(ctx, enemy) {
    const usedSprite = this.drawEnemySprite(ctx, enemy);
    if (usedSprite) {
      this.drawEnemyStatus(ctx, enemy);
      return;
    }

    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.rotate(enemy.angle || 0);

    ctx.fillStyle = enemy.frozen > 0 ? "#73a9ff" : enemy.color;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#101317";
    ctx.beginPath();
    ctx.arc(enemy.radius * 0.38, -enemy.radius * 0.24, enemy.radius * 0.14, 0, Math.PI * 2);
    ctx.arc(enemy.radius * 0.38, enemy.radius * 0.24, enemy.radius * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    this.drawEnemyStatus(ctx, enemy);
  }

  drawEnemyStatus(ctx, enemy) {
    const barWidth = enemy.radius * 2.2;
    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(enemy.x - barWidth / 2, enemy.y - enemy.radius - 16, barWidth, 6);
    ctx.fillStyle = enemy.type === "boss" ? "#a747d9" : "#d95757";
    ctx.fillRect(enemy.x - barWidth / 2, enemy.y - enemy.radius - 16, barWidth * Math.max(0, enemy.hp / enemy.maxHp), 6);

    if (enemy.specialCooldown < 0.25 && (enemy.type === "brute" || enemy.type === "ranger" || enemy.type === "boss")) {
      ctx.strokeStyle = "#f2b85b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (enemy.state === "windup") {
      ctx.strokeStyle = "#f2b85b";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius + 13 + Math.sin(performance.now() / 60) * 3, 0, Math.PI * 2);
      ctx.stroke();
    } else if (!enemy.alert && enemy.type !== "boss") {
      ctx.fillStyle = "rgba(246, 241, 232, 0.55)";
      ctx.font = "800 16px ui-sans-serif, system-ui";
      ctx.textAlign = "center";
      ctx.fillText("?", enemy.x, enemy.y - enemy.radius - 24);
      ctx.textAlign = "start";
    }
  }

  drawEnemySprite(ctx, enemy) {
    const spriteId = enemy.bossKind === "broadcaster" ? "bossBroadcaster" : null;
    if (!spriteId) {
      return false;
    }

    const sheet = this.sprites[spriteId];
    if (!sheet?.loaded) {
      return false;
    }

    const animationName = this.enemyAnimationName(enemy);
    const animation = sheet.animations[animationName] ?? sheet.animations.idle;
    const frame = Math.floor(performance.now() / 1000 * animation.fps) % animation.frames;
    const sourceX = frame * sheet.frameWidth;
    const sourceY = animation.row * sheet.frameHeight;
    const drawX = Math.round(enemy.x - sheet.drawWidth / 2);
    const drawY = Math.round(enemy.y - sheet.drawHeight / 2 - 6);

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
    ctx.beginPath();
    this.drawEllipse(ctx, enemy.x, enemy.y + 28, 28, 9);
    ctx.fill();
    ctx.drawImage(sheet.image, sourceX, sourceY, sheet.frameWidth, sheet.frameHeight, drawX, drawY, sheet.drawWidth, sheet.drawHeight);
    ctx.restore();
    return true;
  }

  enemyAnimationName(enemy) {
    if (enemy.state === "windup") {
      if (enemy.nextAction === "micDrop") return "micDrop";
      if (enemy.nextAction === "table") return "table";
      if (enemy.nextAction === "phone") return "phone";
      if (enemy.nextAction === "liveStream") return "liveStream";
    }
    if (enemy.shieldTimer > 0) return "table";
    if (enemy.spriteAction && enemy.spriteAction !== "idle") return enemy.spriteAction;
    return enemy.state === "chase" ? "walk" : "idle";
  }

  drawProjectiles(ctx, projectiles) {
    for (const projectile of projectiles) {
      ctx.fillStyle = projectile.color;
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawSlashes(ctx, slashes) {
    for (const slash of slashes) {
      if (slash.slashStyle === "redSaber") {
        this.drawRedSaberSlash(ctx, slash);
        continue;
      }

      ctx.save();
      ctx.translate(slash.x, slash.y);
      ctx.rotate(slash.angle);
      ctx.strokeStyle = slash.classBonus ? "rgba(242, 184, 91, 0.85)" : "rgba(246, 241, 232, 0.78)";
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.arc(0, 0, slash.radius, -slash.arc / 2, slash.arc / 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawRedSaberSlash(ctx, slash) {
    const lifeRatio = Math.max(0, Math.min(1, slash.life / (slash.totalLife ?? slash.life)));
    const progress = 1 - lifeRatio;
    const sparkRadius = slash.radius + 5 + progress * 10;
    const startAngle = slash.arc >= Math.PI * 2 ? 0 : -slash.arc / 2;
    const endAngle = slash.arc >= Math.PI * 2 ? Math.PI * 2 : slash.arc / 2;

    ctx.save();
    ctx.translate(slash.x, slash.y);
    ctx.rotate(slash.angle + progress * 0.35);
    ctx.globalCompositeOperation = "lighter";

    ctx.strokeStyle = `rgba(255, 42, 32, ${0.24 * lifeRatio})`;
    ctx.lineWidth = 34;
    ctx.beginPath();
    ctx.arc(0, 0, slash.radius, startAngle, endAngle);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 59, 48, ${0.88 * lifeRatio})`;
    ctx.lineWidth = 17;
    ctx.beginPath();
    ctx.arc(0, 0, slash.radius, startAngle, endAngle);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 209, 194, ${0.84 * lifeRatio})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, slash.radius + 1, startAngle, endAngle);
    ctx.stroke();

    ctx.fillStyle = `rgba(255, 132, 91, ${0.78 * lifeRatio})`;
    for (let i = 0; i < 8; i += 1) {
      const angle = -slash.arc / 2 + (slash.arc * i) / 8 + progress * 0.8;
      const sparkLength = 8 + (i % 3) * 4;
      const x = Math.cos(angle) * sparkRadius;
      const y = Math.sin(angle) * sparkRadius;
      ctx.beginPath();
      ctx.ellipse(x, y, sparkLength, 2.2, angle, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawNets(ctx, nets) {
    for (const net of nets) {
      ctx.strokeStyle = net.color;
      ctx.lineWidth = net.sprung ? 4 : 3;
      ctx.beginPath();
      ctx.arc(net.x, net.y, net.sprung ? net.netRadius : net.radius, 0, Math.PI * 2);
      ctx.stroke();

      if (net.sprung) {
        ctx.globalAlpha = 0.35;
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 5) {
          ctx.beginPath();
          ctx.moveTo(net.x, net.y);
          ctx.lineTo(net.x + Math.cos(angle) * net.netRadius, net.y + Math.sin(angle) * net.netRadius);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    }
  }

  drawIcePatches(ctx, patches) {
    for (const patch of patches) {
      ctx.save();
      ctx.globalAlpha = Math.max(0.15, Math.min(0.52, patch.life / 4.2));
      ctx.fillStyle = "rgba(115, 169, 255, 0.34)";
      ctx.strokeStyle = patch.color ?? "#73a9ff";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(patch.x, patch.y, patch.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha *= 0.75;
      for (let i = 0; i < 8; i += 1) {
        const angle = (Math.PI * 2 * i) / 8;
        ctx.beginPath();
        ctx.moveTo(patch.x, patch.y);
        ctx.lineTo(patch.x + Math.cos(angle) * patch.radius * 0.85, patch.y + Math.sin(angle) * patch.radius * 0.85);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  drawLoot(ctx, loot) {
    ctx.textAlign = "center";
    for (const item of loot) {
      const bob = Math.sin(item.bob) * 5;
      if (item.type === "portal") {
        ctx.save();
        ctx.translate(item.x, item.y + bob);
        ctx.strokeStyle = item.color;
        ctx.lineWidth = 6;
        ctx.beginPath();
        this.drawEllipse(ctx, 0, 0, 30, 44);
        ctx.stroke();
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = item.color;
        ctx.beginPath();
        this.drawEllipse(ctx, 0, 0, 18, 32);
        ctx.fill();
        ctx.restore();
        continue;
      }

      if (item.type === "questPortal") {
        ctx.save();
        ctx.translate(item.x, item.y + bob);
        ctx.strokeStyle = item.color;
        ctx.lineWidth = 6;
        ctx.beginPath();
        this.drawEllipse(ctx, 0, 0, 34, 48);
        ctx.stroke();
        ctx.rotate(performance.now() / 650);
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = "#f2b85b";
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 1.55);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      if (item.type === "lobbyCharacter") {
        this.drawLobbyCharacter(ctx, item, bob);
        continue;
      }

      if (item.type === "lobbyPortal") {
        this.drawLobbyPortal(ctx, item, bob);
        continue;
      }

      if (item.type === "lobbySpot") {
        this.drawLobbySpot(ctx, item, bob);
        continue;
      }

      if (item.type === "healthPotion") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
        ctx.beginPath();
        this.drawEllipse(ctx, item.x, item.y + 18, 20, 7);
        ctx.fill();

        ctx.fillStyle = item.color;
        ctx.beginPath();
        this.drawRoundRect(ctx, item.x - 13, item.y - 18 + bob, 26, 34, 7);
        ctx.fill();
        ctx.fillStyle = "#f6f1e8";
        ctx.fillRect(item.x - 7, item.y - 3 + bob, 14, 5);
        ctx.fillRect(item.x - 2, item.y - 8 + bob, 5, 15);
        continue;
      }

      if (item.type === "blueprint") {
        ctx.save();
        ctx.translate(item.x, item.y + bob);
        ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
        ctx.beginPath();
        this.drawEllipse(ctx, 0, 24, 30, 9);
        ctx.fill();

        ctx.fillStyle = "#d7c29a";
        ctx.strokeStyle = item.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        this.drawRoundRect(ctx, -24, -28, 48, 54, 5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "rgba(16, 19, 23, 0.18)";
        ctx.fillRect(-15, -14, 30, 4);
        ctx.fillRect(-15, -5, 24, 4);
        ctx.fillRect(-15, 4, 30, 4);
        ctx.fillStyle = "#101317";
        ctx.font = "900 12px ui-sans-serif, system-ui";
        ctx.fillText(item.playerLabel ?? "BP", 0, 20);
        ctx.restore();
        continue;
      }

      if (item.type === "shop") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
        ctx.beginPath();
        this.drawEllipse(ctx, item.x, item.y + 24, 42, 11);
        ctx.fill();

        ctx.fillStyle = "#8d5a38";
        ctx.beginPath();
        this.drawRoundRect(ctx, item.x - 38, item.y - 6 + bob, 76, 40, 6);
        ctx.fill();
        ctx.strokeStyle = item.color;
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.moveTo(item.x - 44, item.y - 6 + bob);
        ctx.lineTo(item.x - 28, item.y - 34 + bob);
        ctx.lineTo(item.x + 28, item.y - 34 + bob);
        ctx.lineTo(item.x + 44, item.y - 6 + bob);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#101317";
        ctx.font = "900 17px ui-sans-serif, system-ui";
        ctx.fillText("$", item.x, item.y + 19 + bob);
        continue;
      }

      if (item.type === "sage") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
        ctx.beginPath();
        this.drawEllipse(ctx, item.x, item.y + 22, 30, 9);
        ctx.fill();
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.arc(item.x, item.y - 10 + bob, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#5ec28c";
        ctx.beginPath();
        ctx.moveTo(item.x - 26, item.y + 26 + bob);
        ctx.lineTo(item.x, item.y - 8 + bob);
        ctx.lineTo(item.x + 26, item.y + 26 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#101317";
        ctx.font = "900 18px ui-sans-serif, system-ui";
        ctx.fillText("?", item.x, item.y - 3 + bob);
        continue;
      }

      if (item.type === "chest") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
        ctx.beginPath();
        this.drawEllipse(ctx, item.x, item.y + 22, 34, 10);
        ctx.fill();

        ctx.fillStyle = item.opened ? "#6d6258" : item.color;
        ctx.strokeStyle = item.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        this.drawRoundRect(ctx, item.x - 32, item.y - 18 + bob, 64, 38, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.fillRect(item.x - 26, item.y - 2 + bob, 52, 5);
        ctx.fillStyle = item.rarity === "legendary" ? "#f6f1e8" : "#f2b85b";
        ctx.fillRect(item.x - 6, item.y - 8 + bob, 12, 14);
        ctx.fillStyle = "#101317";
        ctx.font = "900 12px ui-sans-serif, system-ui";
        ctx.fillText((item.rarity ?? "common")[0].toUpperCase(), item.x, item.y + 12 + bob);
      }
    }
  }

  drawLobbyCharacter(ctx, item, bob) {
    ctx.save();
    ctx.translate(item.x, item.y + bob);

    ctx.fillStyle = "rgba(0, 0, 0, 0.38)";
    ctx.beginPath();
    this.drawEllipse(ctx, 0, 28, 42, 12);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.strokeStyle = item.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    this.drawRoundRect(ctx, -54, -14, 108, 74, 8);
    ctx.fill();
    ctx.stroke();

    if (!this.drawLobbyCharacterSprite(ctx, item)) {
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(0, -20, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#101317";
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.fillStyle = item.accent;
      if (item.characterId === "swordsman") {
        ctx.save();
        ctx.rotate(-0.58);
        ctx.fillRect(24, -4, 62, 8);
        ctx.fillRect(78, -11, 15, 22);
        ctx.restore();
      } else {
        ctx.strokeStyle = item.accent;
        ctx.lineWidth = 6;
        ctx.beginPath();
        this.drawEllipse(ctx, 30, -18, 24, 36, 0, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
        ctx.fillRect(14, -21, 70, 6);
      }
    }

    ctx.fillStyle = "#f6f1e8";
    ctx.font = "900 13px ui-sans-serif, system-ui";
    ctx.fillText(item.role, 0, 80);
    ctx.restore();
  }

  drawLobbyCharacterSprite(ctx, item) {
    const sheet = this.sprites[item.characterId];
    if (!sheet?.loaded) {
      return false;
    }

    const animation = sheet.animations.idle;
    const frame = Math.floor(performance.now() / 1000 * animation.fps) % animation.frames;
    const sourceX = frame * sheet.frameWidth;
    const sourceY = animation.row * sheet.frameHeight;
    const width = Math.round(sheet.drawWidth * 0.95);
    const height = Math.round(sheet.drawHeight * 0.95);
    ctx.drawImage(sheet.image, sourceX, sourceY, sheet.frameWidth, sheet.frameHeight, -width / 2, -height / 2 - 16, width, height);
    return true;
  }

  drawLobbyPortal(ctx, item, bob) {
    ctx.save();
    ctx.translate(item.x, item.y + bob);

    ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
    ctx.beginPath();
    this.drawEllipse(ctx, 0, 46, 68, 17);
    ctx.fill();

    ctx.strokeStyle = item.color;
    ctx.lineWidth = 8;
    ctx.beginPath();
    this.drawEllipse(ctx, 0, 0, 42, 60);
    ctx.stroke();
    ctx.globalAlpha = 0.42;
    ctx.fillStyle = item.color;
    ctx.beginPath();
    this.drawEllipse(ctx, 0, 0, 28, 45);
    ctx.fill();
    ctx.globalAlpha = 0.85;
    ctx.rotate(performance.now() / 720);
    ctx.strokeStyle = "#f6f1e8";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 1.35);
    ctx.stroke();
    ctx.restore();
  }

  drawLobbySpot(ctx, item, bob) {
    ctx.save();
    ctx.translate(item.x, item.y + bob);

    ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
    ctx.beginPath();
    this.drawEllipse(ctx, 0, 24, 42, 10);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    ctx.strokeStyle = item.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    this.drawRoundRect(ctx, -44, -20, 88, 46, 7);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.arc(0, -32, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-3, -22, 6, 23);

    ctx.fillStyle = "#afa89e";
    ctx.font = "800 12px ui-sans-serif, system-ui";
    ctx.fillText(item.name, 0, 52);
    ctx.restore();
  }

  drawQuestTorches(ctx, stage) {
    if (!stage.isQuest || !stage.quest?.torches) {
      return;
    }

    for (const torch of stage.quest.torches) {
      ctx.save();
      ctx.globalAlpha = 0.65 + Math.sin(performance.now() / 180 + torch.x) * 0.15;
      ctx.fillStyle = "rgba(242, 184, 91, 0.18)";
      ctx.beginPath();
      ctx.arc(torch.x, torch.y, stage.quest.cellSize * 1.75, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#f2b85b";
      ctx.beginPath();
      ctx.arc(torch.x, torch.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawQuestFog(ctx, game) {
    const stage = game.stage;
    const quest = stage.quest;
    if (!stage.isQuest || !quest) {
      return;
    }

    const players = game.alivePlayers().length > 0 ? game.alivePlayers() : game.players;
    const playerCells = players.map((player) => ({
      col: Math.floor((player.x - stage.room.margin) / quest.cellSize),
      row: Math.floor((player.y - stage.room.margin) / quest.cellSize)
    }));

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
    for (let row = 0; row < quest.rows; row += 1) {
      for (let col = 0; col < quest.cols; col += 1) {
        if (this.questCellVisible(quest, col, row, playerCells)) {
          continue;
        }
        ctx.fillRect(
          stage.room.margin + col * quest.cellSize,
          stage.room.margin + row * quest.cellSize,
          quest.cellSize + 1,
          quest.cellSize + 1
        );
      }
    }
    ctx.restore();
  }

  questCellVisible(quest, col, row, playerCells) {
    const playerVisible = playerCells.some((cell) => Math.hypot(cell.col - col, cell.row - row) < 1.85);
    if (playerVisible) {
      return true;
    }
    return quest.torches.some((torch) => Math.hypot(torch.col - col, torch.row - row) < 2.15);
  }

  drawFloaters(ctx, floaters) {
    ctx.font = "700 18px ui-sans-serif, system-ui";
    ctx.textAlign = "center";
    for (const floater of floaters) {
      ctx.globalAlpha = Math.max(0, floater.life / floater.total);
      ctx.fillStyle = floater.color;
      ctx.fillText(floater.text, floater.x, floater.y);
    }
    ctx.globalAlpha = 1;
  }

  drawSpeechBubbles(ctx, bubbles) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "800 15px ui-sans-serif, system-ui";

    for (const bubble of bubbles) {
      const target = bubble.target ?? bubble;
      const x = target.x ?? bubble.x;
      const y = (target.y ?? bubble.y) + bubble.offsetY;
      const lines = this.wrapText(ctx, bubble.text, 210);
      const width = Math.min(238, Math.max(92, ...lines.map((line) => ctx.measureText(line).width + 30)));
      const height = 28 + lines.length * 18;
      const alpha = Math.min(1, bubble.life / 0.22, bubble.life / bubble.total);

      ctx.globalAlpha = alpha;
      ctx.fillStyle = "rgba(10, 12, 15, 0.88)";
      ctx.strokeStyle = bubble.accent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      this.drawRoundRect(ctx, x - width / 2, y - height / 2, width, height, 8);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x - 8, y + height / 2 - 1);
      ctx.lineTo(x, y + height / 2 + 12);
      ctx.lineTo(x + 10, y + height / 2 - 1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = bubble.color;
      lines.forEach((line, index) => {
        const lineY = y - (lines.length - 1) * 9 + index * 18;
        ctx.fillText(line, x, lineY);
      });
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  wrapText(ctx, text, maxWidth) {
    const words = text.split(" ");
    const lines = [];
    let line = "";

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = testLine;
      }
    }

    if (line) {
      lines.push(line);
    }
    return lines;
  }

  drawHud(ctx, game) {
    const scale = this.dpr;

    ctx.save();
    ctx.scale(scale, scale);
    const width = this.canvas.width / scale;
    const height = this.canvas.height / scale;

    ctx.fillStyle = "rgba(10, 12, 15, 0.68)";
    ctx.fillRect(14, 12, 292, 30);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.strokeRect(14, 12, 292, 30);
    ctx.fillStyle = "#f6f1e8";
    ctx.font = "800 13px ui-sans-serif, system-ui";
    ctx.fillText(game.stage.isLobby ? `Lobby: ${game.stage.name}` : `Stage ${game.stage.number}: ${game.stage.name}`, 24, 32);
    ctx.fillStyle = "#afa89e";
    if (game.stage.isLobby) {
      const classCount = game.loot.filter((item) => item.type === "lobbyCharacter").length;
      const quietCount = game.loot.filter((item) => item.type === "lobbySpot").length;
      ctx.fillText(`Classes ${classCount}  Quiet spots ${quietCount}  Gate ready`, 24, 58);
    } else {
      const chestReady = game.loot.some((item) => item.type === "chest") ? "ready" : "none";
      const shopReady = game.loot.some((item) => item.type === "shop") ? "open" : "none";
      ctx.fillText(`Enemies ${game.enemies.length}  Chest ${chestReady}  Shop ${shopReady}`, 24, 58);
    }

    game.players.forEach((player, index) => {
      this.drawPlayerHud(ctx, player, 16, 72 + index * 72);
      if (width > 680) {
        this.drawAbilityButton(ctx, player, width - 154, 30 + index * 74, "ultimate");
        this.drawAbilityButton(ctx, player, width - 78, 30 + index * 74, "extra");
      }
    });

    if (width > 680) {
      ctx.fillStyle = "rgba(10, 12, 15, 0.58)";
      ctx.fillRect(width - 380, height - 42, 366, 28);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.strokeRect(width - 380, height - 42, 366, 28);
      ctx.fillStyle = "#afa89e";
      ctx.font = "700 12px ui-sans-serif, system-ui";
      ctx.fillText("Auto-aim only: P1 R/Q/E/F   P2 / . , Enter", width - 368, height - 24);
    }

    if (game.nearbyInteractable) {
      const item = game.nearbyInteractable;
      const label = this.interactLabel(item);
      const statLine = item.type === "chest"
        ? `${item.name}: choose one of three rewards`
        : item.type === "shop"
          ? `${item.name}: paid stock available`
          : item.type === "blueprint"
            ? item.description
            : "";
      const boxWidth = Math.min(width - 28, Math.max(width <= 680 ? 280 : 360, Math.max(label.length, statLine.length) * 7.4));
      const x = this.canvas.width / scale / 2 - boxWidth / 2;
      const boxHeight = statLine ? 62 : 42;
      const y = this.canvas.height / scale - (width <= 680 ? 188 : statLine ? 112 : 88);
      ctx.fillStyle = "rgba(10, 12, 15, 0.82)";
      ctx.fillRect(x, y, boxWidth, boxHeight);
      ctx.strokeStyle = item.color;
      ctx.strokeRect(x, y, boxWidth, boxHeight);
      ctx.fillStyle = "#f6f1e8";
      ctx.font = "800 14px ui-sans-serif, system-ui";
      ctx.textAlign = "center";
      ctx.fillText(label, this.canvas.width / scale / 2, y + 27);
      if (statLine) {
        ctx.fillStyle = "#afa89e";
        ctx.font = "700 13px ui-sans-serif, system-ui";
        ctx.fillText(statLine, this.canvas.width / scale / 2, y + 47);
      }
      ctx.textAlign = "start";
    }
    ctx.restore();
  }

  drawPlayerHud(ctx, player, x, y) {
    const compact = this.canvas.width <= 680;
    const panelW = compact ? Math.min(246, this.canvas.width - 32) : 276;
    const hpW = compact ? 108 : 128;
    ctx.fillStyle = "rgba(10, 12, 15, 0.68)";
    ctx.fillRect(x, y, panelW, 62);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.strokeRect(x, y, panelW, 62);
    ctx.fillStyle = player.playerIndex === 1 ? "#73a9ff" : "#f2b85b";
    ctx.font = "900 12px ui-sans-serif, system-ui";
    const roleLabel = player.canMannequinTransform ? `${player.character.role} Form` : player.character.role;
    ctx.fillText(`${player.label} ${roleLabel}`, x + 10, y + 17);
    ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
    ctx.fillRect(x + 10, y + 24, hpW, 8);
    ctx.fillStyle = player.hp > 0 ? "#d95757" : "#6d6258";
    ctx.fillRect(x + 10, y + 24, hpW * Math.max(0, player.hp / player.maxHp), 8);
    ctx.fillStyle = "#afa89e";
    ctx.font = "700 11px ui-sans-serif, system-ui";
    const weaponLine = compact ? player.weapon.name : `${player.weapon.name}  ${weaponStats(player.weapon, player)}`;
    ctx.fillText(this.fitText(ctx, weaponLine, panelW - 20), x + 10, y + 43);
    ctx.fillStyle = "#f2b85b";
    ctx.font = "800 11px ui-sans-serif, system-ui";
    const resourceLine = player.blueprints.weaponEvolution && !player.weaponEvolution.completed
      ? `Weapon BP ${weaponUpgradeRequirementLine(player)}`
      : `Coins ${player.gold}  Ore ${player.materials.weapon}  Core ${player.materials.weaponCore}  Sigils ${player.materials.hero}`;
    ctx.fillText(this.fitText(ctx, resourceLine, panelW - 20), x + 10, y + 57);
  }

  fitText(ctx, text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) {
      return text;
    }
    let clipped = text;
    while (clipped.length > 0 && ctx.measureText(`${clipped}...`).width > maxWidth) {
      clipped = clipped.slice(0, -1);
    }
    return clipped ? `${clipped}...` : "";
  }

  drawAbilityButton(ctx, player, x, y, kind) {
    const isUltimate = kind === "ultimate";
    const radius = 27;
    const cooldown = isUltimate ? player.abilityCooldownValue() : player.extraAbilityCooldown;
    const maxCooldown = isUltimate ? player.abilityCooldownMax() : player.extraAbilityCooldownMax();
    const isTransformButton = !isUltimate && player.canMannequinTransform;
    const hasSlot = isTransformButton || (isUltimate ? Boolean(player.ability) : Boolean(player.extraAbilityId));
    const ready = hasSlot && (isTransformButton || cooldown <= 0);
    const progress = isTransformButton ? 1 : hasSlot ? (ready ? 1 : 1 - cooldown / Math.max(0.01, maxCooldown)) : 0;
    const color = isUltimate ? player.character.accent : player.playerIndex === 1 ? "#73a9ff" : "#f2b85b";

    ctx.save();
    ctx.fillStyle = "rgba(10, 12, 15, 0.82)";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.strokeStyle = ready ? color : "rgba(255, 255, 255, 0.28)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(x, y, radius - 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, Math.min(1, progress)));
    ctx.stroke();

    this.drawAbilityIcon(ctx, player, x, y, kind, color);
    if (!ready) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.52)";
      ctx.beginPath();
      ctx.arc(x, y, radius - 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f6f1e8";
      ctx.font = "900 12px ui-sans-serif, system-ui";
      ctx.textAlign = "center";
      ctx.fillText(hasSlot && cooldown > 0 ? Math.ceil(cooldown).toString() : "LOCK", x, y + 4);
    }
    if (player.transformEntry?.active && isTransformButton) {
      ctx.fillStyle = "#f6f1e8";
      ctx.font = "900 10px ui-sans-serif, system-ui";
      ctx.textAlign = "center";
      ctx.fillText(player.transformEntry.buffer || "...", x, y + 4);
    }
    ctx.fillStyle = "#afa89e";
    ctx.font = "800 10px ui-sans-serif, system-ui";
    ctx.textAlign = "center";
    ctx.fillText(isUltimate ? "ULT" : isTransformButton ? "FORM" : "EVO", x, y + 42);
    ctx.restore();
  }

  drawAbilityIcon(ctx, player, x, y, kind, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.translate(x, y);
    if (kind === "extra" && player.canMannequinTransform) {
      ctx.beginPath();
      ctx.arc(0, 0, 13, Math.PI * 0.15, Math.PI * 1.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(11, -10);
      ctx.lineTo(17, -13);
      ctx.lineTo(14, -5);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if ((kind === "ultimate" && !player.ability) || (kind === "extra" && !player.extraAbilityId)) {
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-10, 10);
      ctx.lineTo(10, -10);
      ctx.stroke();
    } else if (kind === "extra" && player.extraAbilityId === "arrowStorm") {
      ctx.beginPath();
      ctx.arc(0, 2, 13, 0.2, Math.PI * 1.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-10, -8);
      ctx.lineTo(10, 12);
      ctx.moveTo(10, -8);
      ctx.lineTo(-10, 12);
      ctx.stroke();
    } else if (kind === "extra" && player.extraAbilityId === "guardBreaker") {
      ctx.beginPath();
      ctx.moveTo(-15, 10);
      ctx.lineTo(14, -10);
      ctx.lineTo(8, -12);
      ctx.moveTo(14, -10);
      ctx.lineTo(14, -3);
      ctx.stroke();
    } else if (player.character.classId === "archer") {
      ctx.beginPath();
      ctx.arc(-2, 0, 14, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(15, 0);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0.2, Math.PI * 1.65);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(9, -10);
      ctx.lineTo(16, -13);
      ctx.lineTo(13, -5);
      ctx.fill();
    }
    ctx.restore();
  }

  drawRewardChoices(ctx, game) {
    if (!game.rewardChoices) {
      return;
    }

    ctx.save();
    ctx.fillStyle = "rgba(5, 7, 10, 0.72)";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.fillStyle = "#f6f1e8";
    const compact = this.canvas.width < 680;
    ctx.font = compact ? "900 21px ui-sans-serif, system-ui" : "900 28px ui-sans-serif, system-ui";
    ctx.textAlign = "center";
    const source = game.rewardChest;
    const isShop = source?.type === "shop";
    ctx.fillText(isShop ? "Choose One Shop Offer" : "Choose One Reward", this.canvas.width / 2, compact ? 52 : this.canvas.height / 2 - 112);
    ctx.fillStyle = "#afa89e";
    ctx.font = compact ? "700 12px ui-sans-serif, system-ui" : "700 14px ui-sans-serif, system-ui";
    const pickerLabel = game.rewardPicker ? `${game.rewardPicker.label} ${isShop ? "shop" : "reward"}` : isShop ? "Shop" : "Reward";
    const chestLabel = source ? (isShop ? `${pickerLabel}: ${source.name} offers are active` : `${pickerLabel}: ${source.name} odds are active`) : "Click a reward or press 1, 2, or 3";
    ctx.fillText(this.fitText(ctx, chestLabel, this.canvas.width - 36), this.canvas.width / 2, compact ? 76 : this.canvas.height / 2 - 84);
    if (source) {
      ctx.fillStyle = source.color;
      ctx.font = compact ? "800 12px ui-sans-serif, system-ui" : "800 13px ui-sans-serif, system-ui";
      const prompt = compact
        ? isShop ? "Tap an offer, or USE to leave" : "Tap a reward"
        : isShop ? "Click an offer, press 1-3, or press interact/Esc to leave" : "Click a reward or press 1, 2, or 3";
      ctx.fillText(prompt, this.canvas.width / 2, compact ? 96 : this.canvas.height / 2 - 64);
    }

    const boxes = game.rewardChoiceBoxes();
    game.rewardChoices.forEach((reward, index) => {
      const box = boxes[index];
      const color = rewardColors[reward.rarity] ?? "#f6f1e8";
      ctx.fillStyle = "rgba(18, 22, 27, 0.96)";
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      this.drawRoundRect(ctx, box.x, box.y, box.w, box.h, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = compact ? "900 12px ui-sans-serif, system-ui" : "900 13px ui-sans-serif, system-ui";
      ctx.fillText(`${index + 1}  ${reward.type.toUpperCase()}`, box.x + box.w / 2, box.y + (compact ? 22 : 28));

      if (isShop && reward.cost) {
        const canAfford = (game.rewardPicker?.gold ?? 0) >= reward.cost;
        ctx.fillStyle = canAfford ? "#f2b85b" : "#d95757";
        ctx.font = compact ? "900 12px ui-sans-serif, system-ui" : "900 13px ui-sans-serif, system-ui";
        ctx.fillText(`${reward.cost} coins`, box.x + box.w / 2, box.y + (compact ? 40 : 48));
      }

      ctx.fillStyle = "#f6f1e8";
      ctx.font = compact ? "900 16px ui-sans-serif, system-ui" : "900 20px ui-sans-serif, system-ui";
      this.wrapText(ctx, reward.name, box.w - 34).forEach((line, lineIndex) => {
        ctx.fillText(line, box.x + box.w / 2, box.y + (compact ? isShop ? 60 : 46 : isShop ? 78 : 62) + lineIndex * (compact ? 18 : 22));
      });

      ctx.fillStyle = "#afa89e";
      ctx.font = compact ? "700 12px ui-sans-serif, system-ui" : "700 14px ui-sans-serif, system-ui";
      this.wrapText(ctx, reward.description, box.w - 32).slice(0, compact ? 2 : 3).forEach((line, lineIndex) => {
        ctx.fillText(line, box.x + box.w / 2, box.y + (compact ? isShop ? 94 : 82 : isShop ? 122 : 110) + lineIndex * (compact ? 15 : 18));
      });
    });

    ctx.restore();
  }

  interactLabel(item) {
    const prefix = item.playerLabel ? `${item.playerLabel}: ` : "";
    if (item.type === "portal") {
      return `${prefix}Press interact to enter the next room`;
    }
    if (item.type === "questPortal") {
      return `${prefix}Press interact to enter the hidden quest`;
    }
    if (item.type === "lobbyCharacter") {
      return `${prefix}Press interact to become ${item.name}`;
    }
    if (item.type === "lobbyPortal") {
      return `${prefix}Press interact to enter the dungeon`;
    }
    if (item.type === "lobbySpot") {
      return `${prefix}Press interact to inspect ${item.name}`;
    }
    if (item.type === "healthPotion") {
      return `${prefix}Press interact to drink health pot (+${item.healAmount} HP)`;
    }
    if (item.type === "shop") {
      return `${prefix}Press interact to browse ${item.name ?? "shop"} stock`;
    }
    if (item.type === "blueprint") {
      return `${prefix}Press interact to claim ${item.name ?? "weapon blueprint"}`;
    }
    if (item.type === "sage") {
      return `${prefix}Press interact to deliver the message`;
    }
    return `${prefix}Press interact to open ${item.name ?? "reward chest"}`;
  }
}
