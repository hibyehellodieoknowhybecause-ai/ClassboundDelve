import { keybindLabels, codeToLabel, resetKeybinds, saveKeybinds } from "./settings.js";
import { heroAscensionRequirementLine, rewardColors, rewardInfoFor, weaponUpgradeBlueprintFor, weaponUpgradeRequirementLine } from "./data/rewards.js";

const rarityOrder = ["common", "uncommon", "rare", "epic", "legendary"];
const upgradeTypes = new Set(["Stat", "Passive", "Ability", "Pet", "Evolution"]);

export class UI {
  constructor(input) {
    this.input = input;
    this.pendingKeybinds = { ...input.keybinds };
    this.listeningFor = null;
    this.elements = {
      menu: document.querySelector("#menu"),
      settings: document.querySelector("#settings"),
      gameOver: document.querySelector("#gameOver"),
      startGame: document.querySelector("#startGame"),
      startCoop: document.querySelector("#startCoop"),
      openSettings: document.querySelector("#openSettings"),
      closeSettings: document.querySelector("#closeSettings"),
      controlsTab: document.querySelector("#controlsTab"),
      upgradesTab: document.querySelector("#upgradesTab"),
      itemsTab: document.querySelector("#itemsTab"),
      petsTab: document.querySelector("#petsTab"),
      statsTab: document.querySelector("#statsTab"),
      secretCodesTab: document.querySelector("#secretCodesTab"),
      controlsPanel: document.querySelector("#controlsPanel"),
      upgradesPanel: document.querySelector("#upgradesPanel"),
      itemsPanel: document.querySelector("#itemsPanel"),
      petsPanel: document.querySelector("#petsPanel"),
      statsPanel: document.querySelector("#statsPanel"),
      secretCodesPanel: document.querySelector("#secretCodesPanel"),
      keybindRows: document.querySelector("#keybindRows"),
      upgradeRows: document.querySelector("#upgradeRows"),
      upgradeDetail: document.querySelector("#upgradeDetail"),
      upgradeDetailName: document.querySelector("#upgradeDetailName"),
      upgradeDetailMeta: document.querySelector("#upgradeDetailMeta"),
      upgradeDetailDescription: document.querySelector("#upgradeDetailDescription"),
      itemRows: document.querySelector("#itemRows"),
      itemDetail: document.querySelector("#itemDetail"),
      petRows: document.querySelector("#petRows"),
      statRows: document.querySelector("#statRows"),
      resetKeybinds: document.querySelector("#resetKeybinds"),
      saveSettings: document.querySelector("#saveSettings"),
      secretCodeForm: document.querySelector("#secretCodeForm"),
      secretCodeInput: document.querySelector("#secretCodeInput"),
      secretCodeMessage: document.querySelector("#secretCodeMessage"),
      coinPrompt: document.querySelector("#coinPrompt"),
      coinAmountInput: document.querySelector("#coinAmountInput"),
      cancelCoins: document.querySelector("#cancelCoins"),
      dropPrompt: document.querySelector("#dropPrompt"),
      dropNameInput: document.querySelector("#dropNameInput"),
      dropAmountInput: document.querySelector("#dropAmountInput"),
      cancelDrop: document.querySelector("#cancelDrop"),
      touchControls: document.querySelector("#touchControls"),
      touchStick: document.querySelector("#touchStick"),
      touchStickKnob: document.querySelector("#touchStickKnob"),
      restartGame: document.querySelector("#restartGame"),
      gameOverTitle: document.querySelector("#gameOverTitle"),
      gameOverStats: document.querySelector("#gameOverStats")
    };
  }

  init(callbacks) {
    this.callbacks = callbacks;
    this.renderKeybinds();

    this.elements.startGame.addEventListener("click", () => callbacks.start("mannequin", 1));
    this.elements.startCoop.addEventListener("click", () => callbacks.start("mannequin", 2));
    this.elements.openSettings.addEventListener("click", () => this.showSettings());
    this.elements.closeSettings.addEventListener("click", () => this.hideSettings());
    this.bindSettingsTab(this.elements.controlsTab, "controls");
    this.bindSettingsTab(this.elements.upgradesTab, "upgrades");
    this.bindSettingsTab(this.elements.itemsTab, "items");
    this.bindSettingsTab(this.elements.petsTab, "pets");
    this.bindSettingsTab(this.elements.statsTab, "stats");
    this.bindSettingsTab(this.elements.secretCodesTab, "secretCodes");
    this.elements.saveSettings.addEventListener("click", () => this.saveSettings());
    this.elements.resetKeybinds.addEventListener("click", () => {
      this.pendingKeybinds = resetKeybinds();
      this.input.setKeybinds(this.pendingKeybinds);
      this.renderKeybinds();
    });
    this.elements.restartGame.addEventListener("click", () => {
      this.hideGameOver();
      this.showMenu();
    });
    this.elements.secretCodeForm.addEventListener("submit", (event) => {
      event.preventDefault();
      this.submitSecretCode();
    });
    this.elements.coinPrompt.addEventListener("submit", (event) => {
      event.preventDefault();
      this.submitCoinAmount();
    });
    this.elements.cancelCoins.addEventListener("click", () => this.hideCoinPrompt());
    this.elements.dropPrompt.addEventListener("submit", (event) => {
      event.preventDefault();
      this.submitDropAmount();
    });
    this.elements.cancelDrop.addEventListener("click", () => this.hideDropPrompt());
    this.bindTouchControls();

    window.addEventListener("keydown", (event) => {
      if (!this.listeningFor) {
        return;
      }
      event.preventDefault();
      this.pendingKeybinds[this.listeningFor] = event.code;
      this.listeningFor = null;
      this.renderKeybinds();
    }, true);
  }

  bindSettingsTab(button, tab) {
    const activate = (event) => {
      event.preventDefault();
      this.showSettingsTab(tab);
    };
    button.addEventListener("click", activate);
    button.addEventListener("touchend", activate, { passive: false });
  }

  bindTouchControls() {
    const stick = this.elements.touchStick;
    const knob = this.elements.touchStickKnob;
    if (!stick || !knob) {
      return;
    }

    let stickPointerId = null;
    const resetStick = () => {
      stickPointerId = null;
      this.input.setVirtualAxis(0, 0);
      knob.style.transform = "translate(-50%, -50%)";
    };
    const updateStick = (event) => {
      const rect = stick.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const radius = rect.width / 2;
      const dx = event.clientX - centerX;
      const dy = event.clientY - centerY;
      const distance = Math.min(radius, Math.hypot(dx, dy));
      const angle = Math.atan2(dy, dx);
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      this.input.setVirtualAxis(x / radius, y / radius);
      knob.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
    };

    stick.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      stickPointerId = event.pointerId;
      stick.setPointerCapture(event.pointerId);
      updateStick(event);
    });
    stick.addEventListener("pointermove", (event) => {
      if (event.pointerId === stickPointerId) {
        event.preventDefault();
        updateStick(event);
      }
    });
    stick.addEventListener("pointerup", resetStick);
    stick.addEventListener("pointercancel", resetStick);

    this.elements.touchControls?.querySelectorAll("[data-touch-action]").forEach((button) => {
      const action = button.dataset.touchAction;
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        this.input.pressVirtualAction(action);
      });
      const release = (event) => {
        event.preventDefault();
        this.input.releaseVirtualAction(action);
      };
      button.addEventListener("pointerup", release);
      button.addEventListener("pointercancel", release);
      button.addEventListener("lostpointercapture", () => this.input.releaseVirtualAction(action));
    });
  }

  showSettingsTab(tab) {
    const controlsActive = tab === "controls";
    const upgradesActive = tab === "upgrades";
    const itemsActive = tab === "items";
    const petsActive = tab === "pets";
    const statsActive = tab === "stats";
    const secretActive = tab === "secretCodes";
    this.elements.controlsTab.classList.toggle("active", controlsActive);
    this.elements.upgradesTab.classList.toggle("active", upgradesActive);
    this.elements.itemsTab.classList.toggle("active", itemsActive);
    this.elements.petsTab.classList.toggle("active", petsActive);
    this.elements.statsTab.classList.toggle("active", statsActive);
    this.elements.secretCodesTab.classList.toggle("active", secretActive);
    this.elements.controlsPanel.classList.toggle("hidden", !controlsActive);
    this.elements.upgradesPanel.classList.toggle("hidden", !upgradesActive);
    this.elements.itemsPanel.classList.toggle("hidden", !itemsActive);
    this.elements.petsPanel.classList.toggle("hidden", !petsActive);
    this.elements.statsPanel.classList.toggle("hidden", !statsActive);
    this.elements.secretCodesPanel.classList.toggle("hidden", !secretActive);
    if (upgradesActive) {
      this.renderUpgrades();
    }
    if (itemsActive) {
      this.renderItems();
    }
    if (petsActive) {
      this.renderPets();
    }
    if (statsActive) {
      this.renderStats();
    }
  }

  renderUpgrades() {
    const rows = this.elements.upgradeRows;
    rows.innerHTML = "";
    const players = this.callbacks.players?.() ?? [];
    const entries = players.flatMap((player) => this.upgradeEntriesForPlayer(player));

    if (entries.length === 0) {
      rows.innerHTML = `<div class="upgrade-empty">No upgrades gained yet.</div>`;
      this.showUpgradeDetail(null);
      return;
    }

    let currentGroup = "";
    entries.forEach((entry, index) => {
      if (entry.group !== currentGroup) {
        currentGroup = entry.group;
        const heading = document.createElement("div");
        heading.className = "upgrade-group";
        heading.textContent = currentGroup;
        rows.appendChild(heading);
      }

      const button = document.createElement("button");
      button.type = "button";
      button.className = "upgrade-row";
      button.style.setProperty("--rarity-color", rewardColors[entry.rarity] ?? "#f6f1e8");
      button.innerHTML = `
        <span class="upgrade-row-main">
          <span class="upgrade-name">${entry.name}</span>
          <span class="upgrade-meta">${entry.rarity.toUpperCase()} · ${entry.type}</span>
        </span>
        ${entry.count > 1 ? `<span class="upgrade-count">x${entry.count}</span>` : ""}
      `;
      button.addEventListener("click", () => {
        rows.querySelectorAll(".upgrade-row.selected").forEach((candidate) => candidate.classList.remove("selected"));
        button.classList.add("selected");
        this.showUpgradeDetail(entry);
      });
      rows.appendChild(button);
      if (index === 0) {
        button.classList.add("selected");
        this.showUpgradeDetail(entry);
      }
    });
  }

  upgradeEntriesForPlayer(player) {
    if (!player) {
      return [];
    }

    const counts = new Map();
    for (const id of player.rewardHistory ?? []) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    if (player.passives?.has("sageDashStrike")) {
      counts.set("questSageFootwork", 1);
    }
    if (player.dragonFireBreath) {
      counts.set("questFireBreath", 1);
    }

    return [...counts.entries()]
      .map(([id, count]) => ({ ...this.upgradeInfoFor(id), count, group: player.label ?? "Player" }))
      .filter((entry) => entry.id && upgradeTypes.has(entry.type))
      .sort((a, b) => {
        const rarityDelta = rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
        if (rarityDelta !== 0) {
          return rarityDelta;
        }
        return a.name.localeCompare(b.name);
      });
  }

  upgradeInfoFor(id) {
    const questUpgrades = {
      questSageFootwork: {
        id: "questSageFootwork",
        name: "Sage's Footwork",
        type: "Passive",
        rarity: "rare",
        description: "After dashing, your next attack deals +30% damage for 1 second."
      },
      questFireBreath: {
        id: "questFireBreath",
        name: "Fire Breath",
        type: "Ability",
        rarity: "legendary",
        description: "Dragon Heart reward. Unlocks Fire Breath, applies burn, and grants +200% max HP."
      }
    };
    return questUpgrades[id] ?? rewardInfoFor(id);
  }

  renderItems() {
    const rows = this.elements.itemRows;
    rows.innerHTML = "";
    if (this.elements.itemDetail) {
      this.elements.itemDetail.textContent = "Click a blueprint to view required materials.";
    }
    const players = this.callbacks.players?.() ?? [];
    const entries = players.flatMap((player) => this.itemEntriesForPlayer(player));

    if (entries.length === 0) {
      rows.innerHTML = `<div class="upgrade-empty">No items yet.</div>`;
      return;
    }

    let currentGroup = "";
    for (const entry of entries) {
      if (entry.group !== currentGroup) {
        currentGroup = entry.group;
        const heading = document.createElement("div");
        heading.className = "upgrade-group";
        heading.textContent = currentGroup;
        rows.appendChild(heading);
      }

      const row = document.createElement(entry.detail ? "button" : "div");
      row.className = `item-row${entry.detail ? " clickable" : ""}`;
      if (entry.detail) {
        row.type = "button";
        row.addEventListener("click", () => {
          rows.querySelectorAll(".item-row.selected").forEach((candidate) => candidate.classList.remove("selected"));
          row.classList.add("selected");
          this.showItemDetail(entry);
        });
      }
      row.innerHTML = `
        <span>
          <span class="item-name">${entry.name}</span>
          <span class="item-description">${entry.description}</span>
        </span>
        <span class="item-value">${entry.value}</span>
      `;
      rows.appendChild(row);
    }
  }

  itemEntriesForPlayer(player) {
    if (!player) {
      return [];
    }

    const group = player.label ?? "Player";
    const entries = [
      { group, name: "Coins", value: player.gold ?? 0, description: "Spendable shop currency." },
      { group, name: "Weapon Ore", value: player.materials?.weapon ?? 0, description: "Used for weapon evolution." },
      { group, name: "Tempered Core", value: player.materials?.weaponCore ?? 0, description: "Rare weapon evolution material." },
      { group, name: "Hero Sigil", value: player.materials?.hero ?? 0, description: "Hero ascension material." }
    ];

    if (player.blueprints?.weaponEvolution) {
      const blueprint = weaponUpgradeBlueprintFor(player);
      entries.push({
        group,
        name: "Weapon Evolution Blueprint",
        value: player.weaponEvolution?.completed ? "Complete" : "Owned",
        description: "Click to view weapon evolution materials.",
        detail: `${blueprint.name}: ${weaponUpgradeRequirementLine(player)}. Reward: attack damage +${Math.round(blueprint.damageBonus * 100)}%.`
      });
    }
    if (player.blueprints?.heroAscension) {
      entries.push({
        group,
        name: "Hero Ascension Blueprint",
        value: "Owned",
        description: "Click to view hero ascension materials.",
        detail: `Hero Ascension: ${heroAscensionRequirementLine(player)}. Ascension crafting is tracked here for the current blueprint.`
      });
    }
    if (player.dragonHeart) {
      entries.push({ group, name: "Dragon Heart", value: "Owned", description: "Kingdom quest reward. Powers Fire Breath and the huge max HP gain." });
    }
    if (player.questlines?.hidden?.started) {
      entries.push({ group, name: "Sealed Errand", value: player.questlines.hidden.stage ?? "Started", description: "Hidden maze quest progress." });
    }
    if (player.questlines?.kingdom?.started) {
      entries.push({ group, name: "The Kingdom's Request", value: player.questlines.kingdom.complete ? "Complete" : player.questlines.kingdom.stage ?? "Started", description: "Dragon quest progress." });
    }

    return entries;
  }

  showItemDetail(entry) {
    if (!this.elements.itemDetail) {
      return;
    }
    this.elements.itemDetail.textContent = entry.detail ?? "No extra item details.";
  }

  renderPets() {
    const rows = this.elements.petRows;
    rows.innerHTML = "";
    const players = this.callbacks.players?.() ?? [];
    const entries = players.flatMap((player) => this.petEntriesForPlayer(player));

    if (entries.length === 0) {
      rows.innerHTML = `<div class="upgrade-empty">No pets yet.</div>`;
      return;
    }

    let currentGroup = "";
    for (const entry of entries) {
      if (entry.group !== currentGroup) {
        currentGroup = entry.group;
        const heading = document.createElement("div");
        heading.className = "upgrade-group";
        heading.textContent = currentGroup;
        rows.appendChild(heading);
      }
      const row = document.createElement("div");
      row.className = "item-row";
      row.style.setProperty("--pet-color", entry.color ?? "#f6f1e8");
      row.innerHTML = `
        <span>
          <span class="item-name"><span class="pet-dot"></span>${entry.name}</span>
          <span class="item-description">${entry.description}</span>
        </span>
        <span class="item-value">${entry.value}</span>
      `;
      rows.appendChild(row);
    }
  }

  petEntriesForPlayer(player) {
    if (!player) {
      return [];
    }
    const group = player.label ?? "Player";
    return (player.pets ?? []).map((pet) => {
      if (pet.id === "epicEgg") {
        const remaining = Math.max(0, (pet.hatchStage ?? 0) - (player.game?.stageNumber ?? 0));
        return {
          group,
          name: pet.name ?? "Epic Egg",
          color: pet.color,
          value: remaining > 0 ? `${remaining} stages` : "Ready",
          description: `Hatches 5 stages after pickup. Acquired at stage ${pet.acquiredStage ?? "?"}.`
        };
      }
      return {
        group,
        name: pet.name ?? pet.id ?? "Pet",
        color: pet.color,
        value: pet.bodyguard ? "Summon" : `${Math.round((pet.damage ?? 0) * (1 + (player.statBonuses?.petDamage ?? 0)))} dmg`,
        description: this.petDescription(pet)
      };
    });
  }

  petDescription(pet) {
    if (pet.bodyguard) {
      return "Temporary bodyguard summon that moves freely and attacks enemies.";
    }
    if (pet.id === "mythicalFairy") {
      return "Powerful fairy aura: healing, invulnerability, cooldown, damage, and pet buffs.";
    }
    if (pet.id === "epicSnake") {
      return "Only this pet's attacks poison enemies.";
    }
    if (pet.id === "epicFish") {
      return "Only this pet's attacks slow enemies.";
    }
    if (pet.id === "epicTiger") {
      return "Only this pet's attacks bleed enemies.";
    }
    if (pet.id === "epicBird") {
      return "Periodically boosts pet movement speed.";
    }
    if (pet.id === "epicTortoise") {
      return "Periodically taunts enemies.";
    }
    return pet.freeMove ? "Pet ally that moves freely." : "Pet ally that orbits the player.";
  }

  renderStats() {
    const rows = this.elements.statRows;
    rows.innerHTML = "";
    const players = this.callbacks.players?.() ?? [];
    const entries = players.flatMap((player) => this.statEntriesForPlayer(player));

    if (entries.length === 0) {
      rows.innerHTML = `<div class="upgrade-empty">Start a run to see character stats.</div>`;
      return;
    }

    let currentGroup = "";
    for (const entry of entries) {
      if (entry.group !== currentGroup) {
        currentGroup = entry.group;
        const heading = document.createElement("div");
        heading.className = "upgrade-group";
        heading.textContent = currentGroup;
        rows.appendChild(heading);
      }
      const row = document.createElement("div");
      row.className = "stat-row";
      row.innerHTML = `
        <span class="stat-name">${entry.name}</span>
        <span>${entry.base}</span>
        <span>${entry.bonus}</span>
        <span class="stat-total">${entry.total}</span>
      `;
      rows.appendChild(row);
    }
  }

  statEntriesForPlayer(player) {
    if (!player) {
      return [];
    }
    const group = `${player.label ?? "Player"} ${player.character?.role ?? ""}`.trim();
    const speedBonus = (player.statBonuses?.moveSpeed ?? 0) + (player.petSpeedBoost > 0 ? 0.2 : 0) + (player.fairyBuffTimer > 0 ? 0.35 : 0);
    const attackSpeedBonus = (player.statBonuses?.attackSpeed ?? 0) + (player.fairyBuffTimer > 0 ? 0.25 : 0);
    const damageBonus = (player.statBonuses?.attackDamage ?? 0) + (player.attackDamageBonus?.() ?? 0) + (player.fairyBuffTimer > 0 ? 0.45 : 0);
    const cooldownBonus = (player.statBonuses?.abilityCooldown ?? 0) + (player.fairyBuffTimer > 0 ? 0.2 : 0);
    return [
      { group, name: "Max HP", base: this.number(player.character?.maxHp), bonus: this.signedNumber((player.maxHp ?? 0) - (player.character?.maxHp ?? 0)), total: this.number(player.maxHp) },
      { group, name: "Current HP", base: "-", bonus: "-", total: this.number(player.hp) },
      { group, name: "Base Damage", base: this.number(player.baseDamage), bonus: this.percent(damageBonus), total: this.number(player.attackDamage?.()) },
      { group, name: "Weapon Cooldown", base: `${this.number(player.weapon?.cooldown)}s`, bonus: this.percent(-attackSpeedBonus), total: `${this.number(player.weaponCooldown?.())}s` },
      { group, name: "Move Speed", base: this.number(player.character?.speed), bonus: this.percent(speedBonus), total: this.number((player.character?.speed ?? 0) * (1 + speedBonus)) },
      { group, name: "Dash Cooldown", base: `${this.number(player.character?.dashCooldown)}s`, bonus: this.percent(-(player.statBonuses?.dashCooldown ?? 0)), total: `${this.number((player.character?.dashCooldown ?? 0) * (1 - Math.min(0.55, player.statBonuses?.dashCooldown ?? 0)))}s` },
      { group, name: "Dash Distance", base: "100%", bonus: this.percent(player.statBonuses?.dashDistance ?? 0), total: this.percent(1 + (player.statBonuses?.dashDistance ?? 0), false) },
      { group, name: "Damage Reduction", base: "0%", bonus: this.percent(player.statBonuses?.damageReduction ?? 0), total: this.percent(player.statBonuses?.damageReduction ?? 0, false) },
      { group, name: "Potion Heal", base: "100%", bonus: this.percent(player.statBonuses?.potionHeal ?? 0), total: this.percent(1 + (player.statBonuses?.potionHeal ?? 0), false) },
      { group, name: "Ability Cooldown", base: "100%", bonus: this.percent(-cooldownBonus), total: this.percent(1 - Math.min(0.65, cooldownBonus), false) },
      { group, name: "Pet Damage", base: "100%", bonus: this.percent(player.statBonuses?.petDamage ?? 0), total: this.percent(1 + (player.statBonuses?.petDamage ?? 0), false) },
      { group, name: "Lifesteal", base: "0%", bonus: this.percent(player.statBonuses?.lifesteal ?? 0), total: this.percent(player.statBonuses?.lifesteal ?? 0, false) }
    ];
  }

  number(value) {
    return Number.isFinite(value) ? `${Math.round(value * 10) / 10}` : "-";
  }

  signedNumber(value) {
    if (!Number.isFinite(value) || value === 0) {
      return "0";
    }
    return `${value > 0 ? "+" : ""}${Math.round(value * 10) / 10}`;
  }

  percent(value, signed = true) {
    if (!Number.isFinite(value)) {
      return "-";
    }
    const amount = Math.round(value * 1000) / 10;
    return `${signed && amount > 0 ? "+" : ""}${amount}%`;
  }

  showUpgradeDetail(entry) {
    if (!entry) {
      this.elements.upgradeDetailName.textContent = "No upgrade selected";
      this.elements.upgradeDetailMeta.textContent = "";
      this.elements.upgradeDetailDescription.textContent = "Click an upgrade to read what it does.";
      this.elements.upgradeDetail.style.removeProperty("--rarity-color");
      return;
    }

    this.elements.upgradeDetail.style.setProperty("--rarity-color", rewardColors[entry.rarity] ?? "#f6f1e8");
    this.elements.upgradeDetailName.textContent = entry.name;
    this.elements.upgradeDetailMeta.textContent = `${entry.group} · ${entry.rarity.toUpperCase()} · ${entry.type}${entry.count > 1 ? ` · x${entry.count}` : ""}`;
    this.elements.upgradeDetailDescription.textContent = entry.description ?? "No description available.";
  }

  submitSecretCode() {
    const code = this.elements.secretCodeInput.value.trim();
    if (!code) {
      this.setSecretCodeMessage("Enter a code.");
      return;
    }

    const result = this.callbacks.secretCode?.(code) ?? { ok: false, message: "No code handler." };
    this.setSecretCodeMessage(result.message ?? "");
    this.elements.secretCodeInput.value = "";
    if (result.prompt === "coins") {
      this.showCoinPrompt();
    } else if (result.prompt === "drop") {
      this.showDropPrompt();
    } else {
      this.hideCoinPrompt();
      this.hideDropPrompt();
    }
  }

  showCoinPrompt() {
    this.hideDropPrompt();
    this.elements.coinAmountInput.value = "";
    this.elements.coinPrompt.classList.remove("hidden");
    this.elements.coinAmountInput.focus();
  }

  hideCoinPrompt() {
    this.elements.coinPrompt.classList.add("hidden");
    this.elements.coinAmountInput.value = "";
  }

  showDropPrompt() {
    this.hideCoinPrompt();
    this.elements.dropNameInput.value = "";
    this.elements.dropAmountInput.value = "1";
    this.elements.dropPrompt.classList.remove("hidden");
    this.elements.dropNameInput.focus();
  }

  hideDropPrompt() {
    this.elements.dropPrompt.classList.add("hidden");
    this.elements.dropNameInput.value = "";
    this.elements.dropAmountInput.value = "1";
  }

  submitCoinAmount() {
    const amount = Math.floor(Number(this.elements.coinAmountInput.value));
    if (!Number.isFinite(amount) || amount <= 0) {
      this.setSecretCodeMessage("Enter a positive coin amount.");
      return;
    }
    const result = this.callbacks.grantCoins?.(amount) ?? { ok: false, message: "Coins could not be granted." };
    this.setSecretCodeMessage(result.message ?? "");
    this.hideCoinPrompt();
  }

  submitDropAmount() {
    const query = this.elements.dropNameInput.value.trim();
    const amount = Math.floor(Number(this.elements.dropAmountInput.value));
    if (!query) {
      this.setSecretCodeMessage("Type a drop name first.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      this.setSecretCodeMessage("Enter a positive drop amount.");
      return;
    }
    const result = this.callbacks.grantDrop?.(query, amount) ?? { ok: false, message: "Drop could not be granted." };
    this.setSecretCodeMessage(result.message ?? "");
    if (result.ok) {
      this.hideDropPrompt();
      this.renderUpgrades();
      this.renderItems();
      this.renderPets();
      this.renderStats();
    }
  }

  setSecretCodeMessage(message) {
    this.elements.secretCodeMessage.textContent = message;
  }

  renderKeybinds() {
    this.elements.keybindRows.innerHTML = "";
    for (const [action, label] of Object.entries(keybindLabels)) {
      const row = document.createElement("div");
      row.className = "keybind-row";
      const buttonText = this.listeningFor === action ? "Press a key" : codeToLabel(this.pendingKeybinds[action]);
      row.innerHTML = `<span>${label}</span><button data-action="${action}">${buttonText}</button>`;
      row.querySelector("button").addEventListener("click", () => {
        this.listeningFor = action;
        this.renderKeybinds();
      });
      this.elements.keybindRows.appendChild(row);
    }
  }

  saveSettings() {
    saveKeybinds(this.pendingKeybinds);
    this.input.setKeybinds(this.pendingKeybinds);
    this.hideSettings();
  }

  showMenu() {
    this.elements.menu.classList.remove("hidden");
    this.setTouchControlsVisible(false);
  }

  hideMenu() {
    this.elements.menu.classList.add("hidden");
    this.setTouchControlsVisible(true);
  }

  showSettings() {
    this.setTouchControlsVisible(false);
    this.pendingKeybinds = { ...this.input.keybinds };
    this.renderKeybinds();
    this.renderUpgrades();
    this.renderItems();
    this.renderPets();
    this.renderStats();
    this.showSettingsTab("controls");
    this.elements.settings.classList.remove("hidden");
  }

  hideSettings() {
    this.listeningFor = null;
    this.hideCoinPrompt();
    this.hideDropPrompt();
    this.elements.settings.classList.add("hidden");
    if (this.elements.menu.classList.contains("hidden") && this.elements.gameOver.classList.contains("hidden")) {
      this.setTouchControlsVisible(true);
    }
  }

  toggleSettings() {
    if (this.elements.settings.classList.contains("hidden")) {
      this.showSettings();
    } else {
      this.hideSettings();
    }
  }

  showGameOver(title, stats) {
    this.elements.gameOverTitle.textContent = title;
    this.elements.gameOverStats.textContent = stats;
    this.elements.gameOver.classList.remove("hidden");
    this.setTouchControlsVisible(false);
  }

  hideGameOver() {
    this.elements.gameOver.classList.add("hidden");
  }

  setTouchControlsVisible(visible) {
    this.elements.touchControls?.classList.toggle("hidden", !visible);
    if (!visible) {
      this.input.releaseAllVirtualActions();
    }
  }
}
