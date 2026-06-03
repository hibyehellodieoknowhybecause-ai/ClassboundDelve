import { keybindLabels, codeToLabel, resetKeybinds, saveKeybinds } from "./settings.js";
import { rewardColors, rewardInfoFor } from "./data/rewards.js";

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
      secretCodesTab: document.querySelector("#secretCodesTab"),
      controlsPanel: document.querySelector("#controlsPanel"),
      upgradesPanel: document.querySelector("#upgradesPanel"),
      itemsPanel: document.querySelector("#itemsPanel"),
      secretCodesPanel: document.querySelector("#secretCodesPanel"),
      keybindRows: document.querySelector("#keybindRows"),
      upgradeRows: document.querySelector("#upgradeRows"),
      upgradeDetail: document.querySelector("#upgradeDetail"),
      upgradeDetailName: document.querySelector("#upgradeDetailName"),
      upgradeDetailMeta: document.querySelector("#upgradeDetailMeta"),
      upgradeDetailDescription: document.querySelector("#upgradeDetailDescription"),
      itemRows: document.querySelector("#itemRows"),
      resetKeybinds: document.querySelector("#resetKeybinds"),
      saveSettings: document.querySelector("#saveSettings"),
      secretCodeForm: document.querySelector("#secretCodeForm"),
      secretCodeInput: document.querySelector("#secretCodeInput"),
      secretCodeMessage: document.querySelector("#secretCodeMessage"),
      coinPrompt: document.querySelector("#coinPrompt"),
      coinAmountInput: document.querySelector("#coinAmountInput"),
      cancelCoins: document.querySelector("#cancelCoins"),
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
    const secretActive = tab === "secretCodes";
    this.elements.controlsTab.classList.toggle("active", controlsActive);
    this.elements.upgradesTab.classList.toggle("active", upgradesActive);
    this.elements.itemsTab.classList.toggle("active", itemsActive);
    this.elements.secretCodesTab.classList.toggle("active", secretActive);
    this.elements.controlsPanel.classList.toggle("hidden", !controlsActive);
    this.elements.upgradesPanel.classList.toggle("hidden", !upgradesActive);
    this.elements.itemsPanel.classList.toggle("hidden", !itemsActive);
    this.elements.secretCodesPanel.classList.toggle("hidden", !secretActive);
    if (upgradesActive) {
      this.renderUpgrades();
    }
    if (itemsActive) {
      this.renderItems();
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

      const row = document.createElement("div");
      row.className = "item-row";
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
      entries.push({ group, name: "Weapon Evolution Blueprint", value: player.weaponEvolution?.completed ? "Complete" : "Owned", description: "Allows weapon evolution crafting." });
    }
    if (player.blueprints?.heroAscension) {
      entries.push({ group, name: "Hero Ascension Blueprint", value: "Owned", description: "Unlocks future hero ascension crafting." });
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
    } else {
      this.hideCoinPrompt();
    }
  }

  showCoinPrompt() {
    this.elements.coinAmountInput.value = "";
    this.elements.coinPrompt.classList.remove("hidden");
    this.elements.coinAmountInput.focus();
  }

  hideCoinPrompt() {
    this.elements.coinPrompt.classList.add("hidden");
    this.elements.coinAmountInput.value = "";
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
    this.showSettingsTab("controls");
    this.elements.settings.classList.remove("hidden");
  }

  hideSettings() {
    this.listeningFor = null;
    this.hideCoinPrompt();
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
