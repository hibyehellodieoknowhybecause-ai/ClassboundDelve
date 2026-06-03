import { getCharacter, mannequinCharacter } from "./data/characters.js";
import { weapons } from "./data/weapons.js";
import { applyReward, canApplyReward, completeWeaponUpgrade, rollRewardOptions, rollShopOptions, weaponUpgradeBlueprintFor, weaponUpgradeRequirementLine } from "./data/rewards.js";
import { createDragonQuestStage, createHiddenQuestStage, createLobbyStage, createStage } from "./data/stages.js";
import { Player } from "./player.js";
import { createDragonEnemy, createEnemies, updateEnemies } from "./enemies.js";
import { CombatSystem } from "./combat.js";
import { createBlueprintDrop, createGoldBar, createHealthPotion, createLobbyCharacter, createLobbyPortal, createLobbySpot, createMaterialDrop, createQuestPortal, createSage, nearestInteractable, spawnRewardLoot } from "./loot.js";
import { clamp } from "./utils/math.js";

export class Game {
  constructor(input, ui, renderer) {
    this.input = input;
    this.ui = ui;
    this.renderer = renderer;
    this.combat = new CombatSystem();
    this.camera = { x: 0, y: 0 };
    this.running = false;
    this.stageNumber = 1;
    this.stage = createStage(1);
    this.player = null;
    this.players = [];
    this.playerCount = 1;
    this.enemies = [];
    this.loot = [];
    this.rewardChoices = null;
    this.rewardChest = null;
    this.rewardPicker = null;
    this.roomCleared = false;
    this.lastTime = 0;
    this.clearTimer = 0;
    this.crashed = false;
    this.questReturn = null;
    this.kingdomQuestPlayerIndex = null;
  }

  start(characterId = "mannequin", playerCount = 1) {
    this.playerCount = playerCount;
    this.stageNumber = 0;
    this.stage = createLobbyStage();
    this.players = this.createPlayers(characterId, playerCount);
    this.player = this.players[0];
    this.enemies = [];
    this.loot = this.createLobbyInteractables();
    this.rewardChoices = null;
    this.rewardChest = null;
    this.rewardPicker = null;
    this.roomCleared = false;
    this.combat.reset();
    this.clearTimer = 0;
    this.crashed = false;
    this.questReturn = null;
    this.kingdomQuestPlayerIndex = null;
    this.running = true;
    this.ui.hideMenu();
    this.ui.hideGameOver();
  }

  createPlayers(characterId, playerCount) {
    const p1 = new Player(mannequinCharacter, this.stage.room, {
      playerIndex: 0,
      label: "P1",
      spawnOffsetX: playerCount === 2 ? -42 : 0
    });
    p1.game = this;

    if (playerCount === 1) {
      return [p1];
    }

    const p2 = new Player(mannequinCharacter, this.stage.room, {
      playerIndex: 1,
      label: "P2",
      spawnOffsetX: 42
    });
    p2.game = this;
    return [p1, p2];
  }

  createLobbyInteractables() {
    const room = this.stage.room;
    return [
      createLobbyCharacter(getCharacter("swordsman"), room.width * 0.32, room.height * 0.42),
      createLobbyCharacter(getCharacter("archer"), room.width * 0.68, room.height * 0.42),
      createLobbyPortal(room.width / 2, room.height * 0.78),
      createLobbySpot("event-board", "Event Board", room.width * 0.22, room.height * 0.7),
      createLobbySpot("forge-table", "Quiet Forge", room.width * 0.78, room.height * 0.7),
      createLobbySpot("library-nook", "Library Nook", room.width / 2, room.height * 0.23)
    ];
  }

  loop = (time) => {
    try {
      if (this.crashed) {
        requestAnimationFrame(this.loop);
        return;
      }

      const dt = Math.min(0.033, (time - this.lastTime) / 1000 || 0);
      this.lastTime = time;

      if (this.running) {
        this.update(dt);
      }

      if (this.players.length > 0) {
        this.renderer.render(this);
      } else {
        this.renderer.ctx.clearRect(0, 0, this.renderer.canvas.width, this.renderer.canvas.height);
      }
    } catch (error) {
      this.showCrash(error);
    }

    this.input.consumeFrame();
    requestAnimationFrame(this.loop);
  };

  showCrash(error) {
    this.running = false;
    this.crashed = true;
    const message = error?.message ?? "Unknown render error";
    const ctx = this.renderer.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#121417";
    ctx.fillRect(0, 0, this.renderer.canvas.width, this.renderer.canvas.height);
    ctx.fillStyle = "#f6f1e8";
    ctx.font = "800 24px ui-sans-serif, system-ui";
    ctx.fillText("The game hit an error instead of going black.", 28, 48);
    ctx.fillStyle = "#f2b85b";
    ctx.font = "700 16px ui-sans-serif, system-ui";
    ctx.fillText(message, 28, 82);
    console.error(error);
  }

  update(dt) {
    if (this.rewardChoices) {
      this.updateRewardChoices();
      this.updateCamera();
      return;
    }

    if (this.input.wasPressed("settings")) {
      this.ui.toggleSettings();
    }

    if (!this.ui.elements.settings.classList.contains("hidden")) {
      return;
    }

    if (this.input.consumeSecretCodes(["myster10usly", "mysteriously"])) {
      this.handleSecretCode("mysteriously");
    }

    for (const player of this.players) {
      player.update(dt, this.input, this.camera, this.stage.room, this.combat);
    }
    if (!this.stage.isLobby) {
      updateEnemies(this.enemies, this.alivePlayers(), dt, this.stage.room, this.combat);
      this.combat.update(dt, this.enemies, this.alivePlayers(), this.stage.room);
      this.removeDeadEnemies();
    } else {
      this.combat.update(dt, [], this.alivePlayers(), this.stage.room);
    }
    this.updateLoot(dt);
    if (this.stage.isQuest) {
      this.updateHiddenQuest();
    }
    this.updateCamera();

    if (this.alivePlayers().length === 0) {
      this.running = false;
      this.ui.showGameOver("Defeated", `You reached stage ${this.stage.number} with ${this.player.score} score.`);
      return;
    }

    if (this.stage.isQuest || this.stage.isLobby) {
      return;
    }

    if (this.enemies.length === 0) {
      if (!this.roomCleared) {
        this.roomCleared = true;
        this.loot.push(...this.roomClearLoot());
        this.combat.floatText(this.player.x, this.player.y - 64, "Room clear - loot spawned", "#5ec28c");
      }
    }
  }

  roomClearLoot() {
    const center = this.groupCenter();
    const drops = spawnRewardLoot(this.stage, center);
    if (this.hiddenQuestReady()) {
      drops.push(createQuestPortal(center.x + 150, center.y + 36));
    }
    return drops;
  }

  hiddenQuestReady() {
    return this.players.some((player) => player.questlines.hidden.started && player.questlines.hidden.stage === "ready");
  }

  removeDeadEnemies() {
    const before = this.enemies.length;
    const defeatedEnemies = this.enemies.filter((enemy) => enemy.hp <= 0);
    this.enemies = this.enemies.filter((enemy) => enemy.hp > 0);
    const defeated = before - this.enemies.length;
    if (defeated > 0) {
      for (const player of this.players) {
        player.score += defeated * (this.stage.isBoss ? 100 : 20);
      }
      for (const enemy of defeatedEnemies) {
        if (enemy.bossKind === "dragon") {
          this.completeKingdomRequest(enemy);
          continue;
        }
        this.dropEnemyEconomy(enemy);
        this.dropBossBlueprint(enemy);
        const potBonus = this.players.reduce((best, player) => Math.max(best, player.statBonuses.healthPotDrops), 0);
        if (Math.random() < 0.05 * (1 + potBonus)) {
          this.loot.push(createHealthPotion(enemy.x, enemy.y, this.stage.isBoss ? 48 : 32));
        }
      }
    }
  }

  dropEnemyEconomy(enemy) {
    const gold = enemyGoldValue(enemy, this.stage.number);
    for (const player of this.players) {
      player.gold += gold + player.statBonuses.enemyCoins;
      if (player.blueprints.weaponEvolution && Math.random() < 0.01) {
        this.spawnPlayerMaterialDrop("weapon", 1, player, enemy, player.playerIndex);
        this.combat.floatText(enemy.x, enemy.y - enemy.radius - 38, `${player.label} Weapon Ore dropped`, "#73a9ff");
      }
      if (player.blueprints.heroAscension && Math.random() < 0.01) {
        player.materials.hero += 1;
        this.combat.floatText(player.x, player.y - 86, "+1 Hero Sigil", "#f2b85b");
      }
    }
    this.combat.floatText(enemy.x, enemy.y - enemy.radius - 18, `+${gold} coin`, "#f2b85b");
  }

  dropBossBlueprint(enemy) {
    if (enemy.type !== "boss") {
      return;
    }

    if (this.stage.number === 5) {
      for (const player of this.players) {
        const blueprint = weaponUpgradeBlueprintFor(player);
        const offset = player.playerIndex === 0 ? -46 : 46;
        this.loot.push(createBlueprintDrop(
          "weaponEvolution",
          blueprint.name,
          player,
          enemy.x + offset,
          enemy.y + enemy.radius + 52,
          blueprint.description
        ));
      }
      this.combat.floatText(enemy.x, enemy.y - enemy.radius - 40, "Weapon blueprints dropped", "#73a9ff");
    }

    if (this.stage.number > 5) {
      this.grantWeaponBlueprintBossProgress(enemy);
    }

    if (this.stage.number === 10) {
      for (const player of this.players) {
        player.blueprints.heroAscension = true;
      }
      this.combat.floatText(enemy.x, enemy.y - enemy.radius - 40, "Hero blueprint discovered", "#f2b85b");
    }
  }

  grantWeaponBlueprintBossProgress(enemy) {
    for (const player of this.players) {
      if (!player.blueprints.weaponEvolution || player.weaponEvolution.completed) {
        continue;
      }
      this.spawnPlayerMaterialDrop("weaponCore", 1, player, enemy, player.playerIndex * 2);
      this.spawnPlayerMaterialDrop("weapon", 2, player, enemy, player.playerIndex * 2 + 1);
      this.combat.floatText(enemy.x, enemy.y - enemy.radius - 62 - player.playerIndex * 20, `${player.label} upgrade materials dropped`, "#73a9ff");
    }
  }

  spawnPlayerMaterialDrop(material, amount, player, source, slot = 0) {
    const angle = -Math.PI / 2 + slot * 0.72;
    const radius = source.radius + 58 + (slot % 2) * 18;
    this.loot.push(createMaterialDrop(
      material,
      amount,
      player,
      source.x + Math.cos(angle) * radius,
      source.y + Math.sin(angle) * radius
    ));
  }

  collectBlueprint(player, target) {
    if (target.blueprintId !== "weaponEvolution") {
      return;
    }
    player.blueprints.weaponEvolution = true;
    this.loot = this.loot.filter((item) => item.id !== target.id);
    this.combat.floatText(player.x, player.y - 82, `${target.name} claimed`, target.color);
    this.combat.floatText(player.x, player.y - 60, weaponUpgradeRequirementLine(player), "#afa89e");
    this.tryCompleteWeaponUpgrade(player);
  }

  collectMaterial(player, target) {
    if (target.material === "weaponCore") {
      player.materials.weaponCore += target.amount;
    } else if (target.material === "weapon") {
      player.materials.weapon += target.amount;
    } else {
      return;
    }
    this.loot = this.loot.filter((item) => item.id !== target.id);
    const amountLabel = target.amount > 1 ? `+${target.amount}` : "+1";
    this.combat.floatText(player.x, player.y - 72, `${amountLabel} ${target.name}`, target.color);
    this.tryCompleteWeaponUpgrade(player);
  }

  tryCompleteWeaponUpgrade(player, source = player) {
    const blueprint = completeWeaponUpgrade(player);
    if (!blueprint) {
      return false;
    }
    this.combat.floatText(source.x, source.y - 124, `${blueprint.name} complete`, "#f2b85b");
    this.combat.floatText(player.x, player.y - 104, `Attack damage +${Math.round(blueprint.damageBonus * 100)}%`, "#73a9ff");
    return true;
  }

  grantSecretNuke() {
    if (this.players.length === 0) {
      return;
    }
    for (const player of this.players) {
      const oldWeapon = player.equipWeapon(weapons.mysteriousNuke);
      this.combat.floatText(player.x, player.y - 64, "Secret weapon unlocked: Mysterious Nuke", "#f2b85b");
      this.combat.floatText(player.x, player.y - 42, `${oldWeapon.name} overwritten`, "#afa89e");
    }
  }

  handleSecretCode(code) {
    const normalized = code.trim().toLowerCase();
    if (!normalized) {
      return { ok: false, message: "Enter a code." };
    }

    if (normalized === "myster10usly" || normalized === "mysteriously" || normalized === "nuke") {
      if (this.players.length === 0) {
        return { ok: false, message: "Start a run before arming the nuke." };
      }
      this.grantSecretNuke();
      return { ok: true, message: "Mysterious Nuke armed." };
    }

    if (normalized === "give me the coins") {
      if (this.players.length === 0) {
        return { ok: false, message: "Start a run before granting coins." };
      }
      return { ok: true, prompt: "coins", message: "How many coins do you want?" };
    }

    return { ok: false, message: "Unknown secret code." };
  }

  grantCoins(amount) {
    if (this.players.length === 0) {
      return { ok: false, message: "Start a run before granting coins." };
    }
    const coins = Math.max(0, Math.floor(amount));
    if (coins <= 0) {
      return { ok: false, message: "Enter a positive coin amount." };
    }
    for (const player of this.players) {
      player.gold += coins;
      this.combat.floatText(player.x, player.y - 72, `+${coins} coins`, "#f2b85b");
    }
    return { ok: true, message: `${coins} coins granted.` };
  }

  updateRewardChoices() {
    if (
      this.rewardChest?.type === "shop" &&
      (this.input.wasCodePressed("Escape") || (this.rewardPicker && this.input.wasPressed(this.rewardPicker.controls.interact)))
    ) {
      this.closeRewardChoices();
      return;
    }

    const numberKeys = ["Digit1", "Digit2", "Digit3"];
    for (let i = 0; i < numberKeys.length; i += 1) {
      if (this.input.wasCodePressed(numberKeys[i])) {
        this.chooseReward(i);
        return;
      }
    }

    if (this.input.mouse.pressed) {
      const choice = this.rewardChoiceAt(this.input.mouse.x, this.input.mouse.y);
      if (choice !== -1) {
        this.chooseReward(choice);
      }
    }
  }

  closeRewardChoices() {
    if (this.rewardPicker) {
      this.combat.floatText(this.rewardPicker.x, this.rewardPicker.y - 62, "Shop closed", "#afa89e");
    }
    this.rewardChoices = null;
    this.rewardChest = null;
    this.rewardPicker = null;
  }

  rewardChoiceAt(mouseX, mouseY) {
    const boxes = this.rewardChoiceBoxes();
    return boxes.findIndex((box) => mouseX >= box.x && mouseX <= box.x + box.w && mouseY >= box.y && mouseY <= box.y + box.h);
  }

  rewardChoiceBoxes() {
    const canvas = this.renderer.canvas;
    const count = this.rewardChoices?.length ?? 3;
    if (canvas.width < 560 || canvas.height >= canvas.width) {
      const cardW = Math.min(canvas.width - 32, 330);
      const gap = 10;
      const maxH = Math.max(280, canvas.height - 142);
      const cardH = clamp((maxH - gap * Math.max(0, count - 1)) / count, 92, 132);
      const totalH = cardH * count + gap * Math.max(0, count - 1);
      const startY = Math.max(92, canvas.height / 2 - totalH / 2 + 28);
      return Array.from({ length: count }, (_, index) => ({
        x: canvas.width / 2 - cardW / 2,
        y: startY + index * (cardH + gap),
        w: cardW,
        h: cardH
      }));
    }
    if (count > 3) {
      const columns = Math.min(3, count);
      const rows = Math.ceil(count / columns);
      const gap = 14;
      const cardW = Math.min(246, Math.max(176, (canvas.width - 120 - gap * (columns - 1)) / columns));
      const cardH = rows > 1 ? 146 : 188;
      const totalW = cardW * columns + gap * (columns - 1);
      const totalH = cardH * rows + gap * (rows - 1);
      const startX = canvas.width / 2 - totalW / 2;
      const startY = canvas.height / 2 - totalH / 2 + 36;
      return Array.from({ length: count }, (_, index) => {
        const col = index % columns;
        const row = Math.floor(index / columns);
        return {
          x: startX + col * (cardW + gap),
          y: startY + row * (cardH + gap),
          w: cardW,
          h: cardH
        };
      });
    }
    const cardW = Math.min(260, Math.max(188, (canvas.width - 120) / 3));
    const cardH = 188;
    const gap = 18;
    const totalW = cardW * count + gap * Math.max(0, count - 1);
    const startX = canvas.width / 2 - totalW / 2;
    const y = canvas.height / 2 - cardH / 2 + 36;
    return Array.from({ length: count }, (_, index) => ({
      x: startX + index * (cardW + gap),
      y,
      w: cardW,
      h: cardH
    }));
  }

  chooseReward(index) {
    const reward = this.rewardChoices?.[index];
    if (!reward) {
      return;
    }
    const targetPlayer = this.rewardPicker ?? this.player;
    if (!canApplyReward(targetPlayer, reward)) {
      const message = this.rewardChest?.type === "shop" ? "Cannot buy that" : "Mannequin cannot learn evo skills";
      this.combat.floatText(targetPlayer.x, targetPlayer.y - 62, message, "#d95757");
      this.rewardChoices = null;
      this.rewardChest = null;
      this.rewardPicker = null;
      return;
    }
    if (this.rewardChest?.type === "shop") {
      if (targetPlayer.gold < reward.cost) {
        this.combat.floatText(targetPlayer.x, targetPlayer.y - 62, `Need ${reward.cost} coins`, "#d95757");
        return;
      }
      targetPlayer.gold -= reward.cost;
      if (!applyReward(targetPlayer, reward)) {
        this.combat.floatText(targetPlayer.x, targetPlayer.y - 62, "Cannot buy that", "#d95757");
        this.rewardChoices = null;
        this.rewardChest = null;
        this.rewardPicker = null;
        return;
      }
      if (reward.id === "hiddenQuestline") {
        this.spawnHiddenQuestPortal(targetPlayer);
      }
      this.tryCompleteWeaponUpgrade(targetPlayer);
      this.rewardChest.stock = (this.rewardChest.stock ?? this.rewardChoices).filter((item, stockIndex) => stockIndex !== index && item.id !== reward.id);
      this.combat.floatText(targetPlayer.x, targetPlayer.y - 62, `${reward.name} bought`, "#f2b85b");
      if (reward.id === "kingdomRequest") {
        this.rewardChoices = null;
        this.rewardChest = null;
        this.rewardPicker = null;
        this.startKingdomRequest(targetPlayer);
        return;
      }
      if (reward.opensChest) {
        this.rewardChoices = rollRewardOptions(targetPlayer, 3, reward.opensChest);
        this.rewardChest = {
          type: "purchasedChest",
          rarity: reward.opensChest,
          name: reward.name
        };
        this.rewardPicker = targetPlayer;
        return;
      }
      if (this.rewardChest.stock.length === 0) {
        this.combat.floatText(targetPlayer.x, targetPlayer.y - 84, "Shop sold out", "#afa89e");
        this.rewardChoices = null;
        this.rewardChest = null;
        this.rewardPicker = null;
        return;
      }
      this.rewardChoices = this.rewardChest.stock;
      return;
    }
    if (!applyReward(targetPlayer, reward)) {
      this.combat.floatText(targetPlayer.x, targetPlayer.y - 62, "Cannot learn that", "#d95757");
      this.rewardChoices = null;
      this.rewardChest = null;
      this.rewardPicker = null;
      return;
    }
    this.combat.floatText(targetPlayer.x, targetPlayer.y - 62, `${reward.name} gained`, "#f2b85b");
    this.rewardChoices = null;
    this.rewardChest = null;
    this.rewardPicker = null;
  }

  updateLoot(dt) {
    for (const item of this.loot) {
      item.bob += dt * 4;
    }

    this.nearbyInteractable = null;
    for (const player of this.alivePlayers()) {
      const target = nearestInteractable(this.loot, player);
      if (target && !this.nearbyInteractable) {
        this.nearbyInteractable = { ...target, playerLabel: player.label };
      }

      if (!target || !this.input.wasPressed(player.controls.interact)) {
        continue;
      }

      if (target.type === "chest") {
        target.opened = true;
        this.rewardChest = target;
        this.rewardPicker = player;
        this.rewardChoices = rollRewardOptions(player, 3, target.rarity);
        this.loot = this.loot.filter((item) => item.id !== target.id);
        return;
      }

      if (target.type === "shop") {
        if (!target.stock) {
          target.stock = rollShopOptions(player, 6);
        }
        if (target.stock.length === 0) {
          this.combat.floatText(player.x, player.y - 62, "Shop sold out", "#afa89e");
          return;
        }
        this.rewardChest = target;
        this.rewardPicker = player;
        this.rewardChoices = target.stock;
        return;
      }

      if (target.type === "lobbyCharacter") {
        this.selectLobbyCharacter(player, target);
        return;
      }

      if (target.type === "lobbyPortal") {
        this.enterDungeonFromLobby();
        return;
      }

      if (target.type === "lobbySpot") {
        this.combat.floatText(player.x, player.y - 58, `${target.name} is quiet for now`, "#afa89e");
        return;
      }

      if (target.type === "healthPotion") {
        const healAmount = Math.round(target.healAmount * (1 + player.statBonuses.potionHeal));
        const healed = player.heal(healAmount);
        this.combat.floatText(player.x, player.y - 54, healed > 0 ? `+${Math.round(healed)} HP` : "HP full", "#5ec28c");
        this.loot = this.loot.filter((item) => item.id !== target.id);
        return;
      }

      if (target.type === "blueprint") {
        this.collectBlueprint(player, target);
        return;
      }

      if (target.type === "material") {
        this.collectMaterial(player, target);
        return;
      }

      if (target.type === "goldBar") {
        this.throwGoldBarAtDragon(player, target);
        return;
      }

      if (target.type === "questPortal") {
        this.startHiddenQuest(player);
        return;
      }

      if (target.type === "sage") {
        this.completeHiddenQuest(player);
        return;
      }

      if (target.type === "portal" && this.roomCleared) {
        this.nextStage();
        return;
      }
    }
  }

  selectLobbyCharacter(player, target) {
    const character = getCharacter(target.characterId);
    player.setCharacter(character);
    this.loot = this.loot.filter((item) => item.id !== target.id);
    this.combat.floatText(player.x, player.y - 64, `${character.name} joined ${player.label}`, character.accent);
  }

  enterDungeonFromLobby() {
    this.stageNumber = 1;
    this.stage = createStage(this.stageNumber);
    this.players.forEach((player, index) => {
      player.x = this.stage.room.width / 2 + (this.players.length === 2 ? (index === 0 ? -48 : 48) : 0);
      player.y = this.stage.room.height / 2;
      player.hp = player.maxHp;
      player.game = this;
    });
    this.player = this.players[0];
    this.enemies = createEnemies(this.stage);
    this.loot = [];
    this.rewardChoices = null;
    this.rewardChest = null;
    this.rewardPicker = null;
    this.roomCleared = false;
    this.combat.reset();
    this.clearTimer = 0;
    this.updateCamera();
  }

  nextStage() {
    for (const player of this.players) {
      player.score += this.stage.clearReward;
    }
    this.stageNumber += 1;
    this.stage = createStage(this.stageNumber);
    this.players.forEach((player, index) => {
      player.x = this.stage.room.width / 2 + (this.players.length === 2 ? (index === 0 ? -48 : 48) : 0);
      player.y = this.stage.room.height / 2;
      player.hp = Math.min(player.maxHp, player.hp + 18);
      player.phoenixBloodAvailable = player.passives.has("phoenixBlood");
      player.game = this;
    });
    this.player = this.players[0];
    this.enemies = createEnemies(this.stage);
    this.loot = [];
    this.rewardChoices = null;
    this.rewardChest = null;
    this.rewardPicker = null;
    this.roomCleared = false;
    this.combat.reset();
    this.clearTimer = 0;
    this.updateCamera();
  }

  spawnHiddenQuestPortal(player) {
    if (this.stage.isQuest || this.loot.some((item) => item.type === "questPortal")) {
      return;
    }
    this.loot.push(createQuestPortal(player.x + 92, player.y - 22));
    this.combat.floatText(player.x, player.y - 82, "A hidden portal opens", "#a747d9");
  }

  startHiddenQuest(player) {
    this.questReturn = {
      stageNumber: this.stageNumber,
      stage: this.stage,
      enemies: this.enemies,
      loot: this.loot.filter((item) => item.type !== "questPortal"),
      roomCleared: this.roomCleared,
      positions: this.players.map((candidate) => ({ x: candidate.x, y: candidate.y }))
    };

    this.stage = createHiddenQuestStage();
    this.enemies = [];
    this.loot = [createSage(this.stage.quest.sage.x, this.stage.quest.sage.y)];
    this.rewardChoices = null;
    this.rewardChest = null;
    this.rewardPicker = null;
    this.roomCleared = false;
    this.combat.reset();

    this.players.forEach((candidate, index) => {
      candidate.x = this.stage.quest.start.x + (this.players.length === 2 ? (index === 0 ? -28 : 28) : 0);
      candidate.y = this.stage.quest.start.y;
      candidate.game = this;
      if (candidate.questlines.hidden.started && candidate.questlines.hidden.stage === "ready") {
        candidate.questlines.hidden.stage = "inMaze";
      }
    });
    this.player = player;
    this.updateCamera();
    this.combat.floatText(this.stage.quest.start.x, this.stage.quest.start.y - 48, "Deliver the message to the sage", "#f2b85b");
  }

  updateHiddenQuest() {
    const quest = this.stage.quest;
    if (!quest) {
      return;
    }

    for (const player of this.alivePlayers()) {
      const cell = this.questCellFor(player);
      if (!cell || quest.wallMap[cell.row]?.[cell.col]) {
        continue;
      }
      const last = quest.lastTorchCell;
      if (Math.abs(cell.col - last.col) + Math.abs(cell.row - last.row) >= 2) {
        quest.torches.push({
          col: cell.col,
          row: cell.row,
          x: this.stage.room.margin + cell.col * quest.cellSize + quest.cellSize / 2,
          y: this.stage.room.margin + cell.row * quest.cellSize + quest.cellSize / 2
        });
        quest.lastTorchCell = cell;
      }
    }
  }

  questCellFor(point) {
    const quest = this.stage.quest;
    if (!quest) {
      return null;
    }
    return {
      col: Math.floor((point.x - this.stage.room.margin) / quest.cellSize),
      row: Math.floor((point.y - this.stage.room.margin) / quest.cellSize)
    };
  }

  completeHiddenQuest(player) {
    for (const candidate of this.players) {
      if (candidate.questlines.hidden.started) {
        candidate.questlines.hidden.stage = "complete";
        candidate.questlines.hidden.progress = 1;
      }
      candidate.passives.add("sageDashStrike");
      candidate.dashStrikeReady = false;
    }
    this.returnFromHiddenQuest();
    this.combat.floatText(player.x, player.y - 68, "Sage's Footwork learned", "#f2b85b");
  }

  startKingdomRequest(player) {
    if (this.stage.isQuest || !player.questlines.kingdom?.started || player.questlines.kingdom.complete) {
      return;
    }
    this.questReturn = {
      stageNumber: this.stageNumber,
      stage: this.stage,
      enemies: this.enemies,
      loot: this.loot,
      roomCleared: this.roomCleared,
      positions: this.players.map((candidate) => ({ x: candidate.x, y: candidate.y }))
    };

    this.stage = createDragonQuestStage();
    this.enemies = [createDragonEnemy(this.stage)];
    this.loot = this.createDragonGoldBars();
    this.rewardChoices = null;
    this.rewardChest = null;
    this.rewardPicker = null;
    this.roomCleared = false;
    this.kingdomQuestPlayerIndex = player.playerIndex;
    this.combat.reset();

    this.players.forEach((candidate, index) => {
      candidate.x = this.stage.dragon.playerStart.x + (this.players.length === 2 ? (index === 0 ? -34 : 34) : 0);
      candidate.y = this.stage.dragon.playerStart.y;
      candidate.game = this;
      if (candidate === player) {
        candidate.questlines.kingdom.stage = "dragon";
      }
    });
    this.player = player;
    this.updateCamera();
    this.combat.floatText(player.x, player.y - 72, "The Kingdom's Request", "#f2b85b");
    this.combat.floatText(player.x, player.y - 50, "Throw gold bars to break the dragon shield", "#afa89e");
  }

  createDragonGoldBars() {
    const center = this.stage.dragon.spawn;
    const bars = [];
    for (let i = 0; i < 8; i += 1) {
      const angle = (Math.PI * 2 * i) / 8;
      const radius = i % 2 === 0 ? 300 : 440;
      bars.push(createGoldBar(
        center.x + Math.cos(angle) * radius,
        center.y + Math.sin(angle) * radius
      ));
    }
    return bars;
  }

  throwGoldBarAtDragon(player, target) {
    const dragon = this.enemies.find((enemy) => enemy.bossKind === "dragon" && enemy.hp > 0);
    if (!dragon) {
      return;
    }
    this.loot = this.loot.filter((item) => item.id !== target.id);
    dragon.frozen = Math.max(dragon.frozen ?? 0, 2);
    dragon.dragonShieldDown = Math.max(dragon.dragonShieldDown ?? 0, 2);
    dragon.state = "chase";
    dragon.specialCooldown = Math.max(dragon.specialCooldown ?? 0, 1.2);
    this.combat.screenShake = Math.max(this.combat.screenShake, 12);
    this.combat.floatText(dragon.x, dragon.y - dragon.radius - 26, "Shield broken", "#f2b85b");
    this.combat.floatText(player.x, player.y - 58, "Gold bar thrown", "#f2b85b");
  }

  completeKingdomRequest(enemy) {
    const player = this.players[this.kingdomQuestPlayerIndex] ?? this.player;
    let grantedDragonHeart = false;
    if (player) {
      player.questlines.kingdom = {
        started: true,
        stage: "complete",
        complete: true
      };
      if (!player.dragonHeart) {
        player.dragonHeart = true;
        player.dragonFireBreath = true;
        player.extraAbilityId = "fireBreath";
        const hpGain = Math.ceil(player.maxHp * 2);
        player.maxHp += hpGain;
        player.hp += hpGain;
        grantedDragonHeart = true;
      }
    }
    this.returnFromQuest();
    if (player) {
      this.combat.floatText(player.x, player.y - 88, grantedDragonHeart ? "Dragon Heart claimed" : "Dragon defeated", "#f2b85b");
      this.combat.floatText(player.x, player.y - 66, "Fire Breath unlocked", "#ef7d57");
    }
  }

  returnFromQuest() {
    if (!this.questReturn) {
      return;
    }
    const saved = this.questReturn;
    this.stageNumber = saved.stageNumber;
    this.stage = saved.stage;
    this.enemies = saved.enemies;
    this.loot = saved.loot;
    this.roomCleared = saved.roomCleared;
    this.players.forEach((player, index) => {
      const position = saved.positions[index] ?? saved.positions[0];
      player.x = position.x;
      player.y = position.y;
      player.game = this;
    });
    this.player = this.players[0];
    this.questReturn = null;
    this.kingdomQuestPlayerIndex = null;
    this.combat.reset();
    this.updateCamera();
  }

  returnFromHiddenQuest() {
    this.returnFromQuest();
  }

  updateCamera() {
    const canvas = this.renderer.canvas;
    const scale = this.renderer.worldScale || 1;
    const viewWidth = canvas.width / scale;
    const viewHeight = canvas.height / scale;
    const center = this.groupCenter();
    this.camera.scale = scale;
    this.camera.x = clamp(center.x - viewWidth / 2, 0, Math.max(0, this.stage.room.width - viewWidth));
    this.camera.y = clamp(center.y - viewHeight / 2, 0, Math.max(0, this.stage.room.height - viewHeight));
  }

  alivePlayers() {
    return this.players.filter((player) => player.hp > 0);
  }

  groupCenter() {
    const players = this.alivePlayers().length > 0 ? this.alivePlayers() : this.players;
    const total = players.reduce((sum, player) => ({ x: sum.x + player.x, y: sum.y + player.y }), { x: 0, y: 0 });
    return {
      x: total.x / Math.max(1, players.length),
      y: total.y / Math.max(1, players.length)
    };
  }
}

function enemyGoldValue(enemy, stageNumber) {
  if (enemy.type === "boss") {
    return 45 + Math.floor(stageNumber * 5);
  }
  const baseValues = {
    scout: 1,
    ranger: 3,
    brute: 4,
    bomber: 2,
    supporter: 1,
    duelist: 2,
    seer: 3,
    mender: 3,
    shade: 4,
    bulwark: 5
  };
  return baseValues[enemy.type] ?? 1;
}
