export const weaponUpgradeBlueprints = {
  swordsman: {
    id: "swordTemperBlueprint",
    name: "Saber Temper Blueprint",
    requirements: {
      weapon: 6,
      weaponCore: 1,
      gold: 450
    },
    damageBonus: 0.35,
    description: "Requires 6 Weapon Ore, 1 Tempered Core, and 450 coins."
  },
  archer: {
    id: "bowstringBlueprint",
    name: "Moonstring Blueprint",
    requirements: {
      weapon: 4,
      weaponCore: 2,
      gold: 520
    },
    damageBonus: 0.35,
    description: "Requires 4 Weapon Ore, 2 Tempered Cores, and 520 coins."
  },
  default: {
    id: "classWeaponBlueprint",
    name: "Class Weapon Blueprint",
    requirements: {
      weapon: 5,
      weaponCore: 2,
      gold: 500
    },
    damageBonus: 0.35,
    description: "Requires 5 Weapon Ore, 2 Tempered Cores, and 500 coins."
  }
};

export function weaponUpgradeBlueprintFor(player) {
  return weaponUpgradeBlueprints[player.character?.classId] ?? weaponUpgradeBlueprints.default;
}

export function weaponUpgradeRequirementLine(player) {
  const blueprint = weaponUpgradeBlueprintFor(player);
  const req = blueprint.requirements;
  return `${player.materials.weapon}/${req.weapon} Ore  ${player.materials.weaponCore}/${req.weaponCore} Core  ${player.gold}/${req.gold} coins`;
}

export function canCompleteWeaponUpgrade(player) {
  if (!player.blueprints.weaponEvolution || player.weaponEvolution.completed) {
    return false;
  }
  const req = weaponUpgradeBlueprintFor(player).requirements;
  return player.materials.weapon >= req.weapon && player.materials.weaponCore >= req.weaponCore && player.gold >= req.gold;
}

export function completeWeaponUpgrade(player) {
  if (!canCompleteWeaponUpgrade(player)) {
    return null;
  }
  const blueprint = weaponUpgradeBlueprintFor(player);
  const req = blueprint.requirements;
  player.materials.weapon -= req.weapon;
  player.materials.weaponCore -= req.weaponCore;
  player.gold -= req.gold;
  player.weaponEvolution.damageBonus += blueprint.damageBonus;
  player.weaponEvolution.completed = true;
  player.weaponEvolution.blueprintId = blueprint.id;
  return blueprint;
}

function addPet(player, pet) {
  player.pets.push({
    angle: Math.random() * Math.PI * 2,
    cooldown: 0.6,
    ...pet
  });
}

function addEpicEgg(player) {
  const maxEggs = player.rewardCount("epicEgg") >= 5 && !player.passives.has("fairyHatched") ? 5 : 6;
  if (player.rewardCount("epicEgg") >= maxEggs) {
    return;
  }
  const roll = Math.random();
  const pet =
    roll < 0.01 ? { id: "mythicalFairy", name: "Mythical Fairy", color: "#f6f1e8", damage: 10, cooldownMax: 1.35, healPulse: true } :
    roll < 0.21 ? { id: "epicSnake", name: "Epic Snake", color: "#5ec28c", damage: 15, cooldownMax: 0.95, slow: 0.4 } :
    roll < 0.41 ? { id: "epicBird", name: "Epic Bird", color: "#f2b85b", damage: 14, cooldownMax: 0.85, speedPulse: true } :
    roll < 0.61 ? { id: "epicFish", name: "Epic Flopping Fish", color: "#73a9ff", damage: 13, cooldownMax: 1.0, slow: 1.0 } :
    roll < 0.81 ? { id: "epicTiger", name: "Epic Tiger", color: "#d95757", damage: 18, cooldownMax: 1.1 } :
    { id: "epicTortoise", name: "Epic Tortoise", color: "#8d5a38", damage: 12, cooldownMax: 1.25 };
  if (pet.id === "mythicalFairy") {
    player.passives.add("fairyHatched");
  }
  addPet(player, pet);
}

const rewardPool = [
  {
    id: "heartCoreCommon",
    type: "Stat",
    name: "Heart Core",
    rarity: "common",
    description: "+10% max HP and heal 10% HP.",
    apply(player) {
      const gain = Math.ceil(player.maxHp * 0.1);
      player.maxHp += gain;
      player.hp = Math.min(player.maxHp, player.hp + gain);
    }
  },
  {
    id: "attackDamage",
    type: "Stat",
    name: "Sharpened Focus",
    rarity: "common",
    description: "+10% attack damage.",
    apply(player) {
      player.statBonuses.attackDamage += 0.1;
    }
  },
  {
    id: "attackSpeed",
    type: "Stat",
    name: "Quick Hands",
    rarity: "common",
    maxCount: 3,
    description: "Weapon cooldown is 10% faster.",
    apply(player) {
      player.statBonuses.attackSpeed += 0.1;
    }
  },
  {
    id: "moveSpeed",
    type: "Stat",
    name: "Fleet Boots",
    rarity: "common",
    maxCount: 10,
    description: "+9% movement speed.",
    apply(player) {
      player.statBonuses.moveSpeed += 0.09;
    }
  },
  {
    id: "sprinter",
    type: "Stat",
    name: "Sprinter",
    rarity: "common",
    maxCount: 10,
    description: "+10% dash distance.",
    apply(player) {
      player.statBonuses.dashDistance += 0.1;
    }
  },
  {
    id: "steadyAim",
    type: "Stat",
    classId: "archer",
    name: "Steady Aim",
    rarity: "common",
    maxCount: 3,
    description: "+20% projectile speed.",
    apply(player) {
      player.statBonuses.projectileSpeed += 0.2;
    }
  },
  {
    id: "magnetCharm",
    type: "Passive",
    name: "Magnet Charm",
    rarity: "common",
    maxCount: 1,
    description: "Interact with health pots, chests, shops, and drops from twice as far away.",
    apply(player) {
      player.passives.add("magnetCharm");
    }
  },
  {
    id: "phoenixBlood",
    type: "Passive",
    name: "Phoenix Blood",
    rarity: "uncommon",
    maxCount: 1,
    description: "Once per room below 35% HP, heal 10% max HP.",
    apply(player) {
      player.passives.add("phoenixBlood");
      player.phoenixBloodAvailable = true;
    }
  },
  {
    id: "momentumGuard",
    type: "Passive",
    name: "Momentum Guard",
    rarity: "uncommon",
    maxCount: 1,
    description: "After dashing, gain 0.2s extra invulnerability.",
    apply(player) {
      player.passives.add("momentumGuard");
    }
  },
  {
    id: "coinSense",
    type: "Passive",
    name: "Coin Sense",
    rarity: "uncommon",
    maxCount: 2,
    description: "Coins from enemies +1.",
    apply(player) {
      player.statBonuses.enemyCoins += 1;
    }
  },
  {
    id: "dashTraining",
    type: "Stat",
    name: "Dash Training",
    rarity: "uncommon",
    maxCount: 3,
    description: "Dash cooldown is 18% faster.",
    apply(player) {
      player.statBonuses.dashCooldown += 0.18;
    }
  },
  {
    id: "ultimateBattery",
    type: "Stat",
    name: "Ultimate Battery",
    rarity: "uncommon",
    maxCount: 3,
    description: "Ultimate cooldown is 10% faster.",
    apply(player) {
      player.statBonuses.abilityCooldown += 0.1;
    }
  },
  {
    id: "potionBelt",
    type: "Stat",
    name: "Potion Belt",
    rarity: "uncommon",
    maxCount: 4,
    description: "Health pots heal 25% more.",
    apply(player) {
      player.statBonuses.potionHeal += 0.25;
    }
  },
  {
    id: "armor",
    type: "Stat",
    name: "Armor",
    rarity: "uncommon",
    maxCount: 5,
    description: "Take 7.5% less damage.",
    apply(player) {
      player.statBonuses.damageReduction += 0.075;
    }
  },
  {
    id: "sharpenedFocus2",
    type: "Stat",
    name: "Sharpened Focus 2",
    rarity: "uncommon",
    description: "+25% attack damage.",
    apply(player) {
      player.statBonuses.attackDamage += 0.25;
    }
  },
  {
    id: "heartCoreUncommon",
    type: "Stat",
    name: "Heart Core",
    rarity: "uncommon",
    description: "+25% max HP and heal 25% HP.",
    apply(player) {
      const gain = Math.ceil(player.maxHp * 0.25);
      player.maxHp += gain;
      player.hp = Math.min(player.maxHp, player.hp + gain);
    }
  },
  {
    id: "secondHeart",
    type: "Passive",
    name: "Second Heart",
    rarity: "rare",
    maxCount: 1,
    description: "Once per run, lethal damage revives you at 45% HP.",
    apply(player) {
      player.passives.add("secondHeart");
      player.reviveAvailable = true;
    }
  },
  {
    id: "cleanStrikes",
    type: "Passive",
    name: "Clean Strikes",
    rarity: "rare",
    maxCount: 1,
    description: "+10% damage. First hit after dashing deals +30% damage.",
    apply(player) {
      player.statBonuses.attackDamage += 0.1;
      player.passives.add("cleanStrikes");
    }
  },
  {
    id: "lastStand",
    type: "Passive",
    name: "Last Stand",
    rarity: "rare",
    maxCount: 1,
    description: "Under 30% HP, gain speed, damage, and attack speed.",
    apply(player) {
      player.passives.add("lastStand");
    }
  },
  {
    id: "healUp",
    type: "Passive",
    name: "Heal Up",
    rarity: "rare",
    maxCount: 2,
    description: "Health pot drop rates increase by 100%.",
    apply(player) {
      player.statBonuses.healthPotDrops += 1;
    }
  },
  {
    id: "regenerate",
    type: "Passive",
    name: "Regenerate",
    rarity: "rare",
    maxCount: 5,
    description: "Restore 1% max HP per second.",
    apply(player) {
      player.statBonuses.regen += 0.01;
    }
  },
  {
    id: "companionSpark",
    type: "Pet",
    name: "Companion Spark",
    rarity: "rare",
    maxCount: 1,
    description: "A pet periodically zaps and slows the nearest enemy.",
    apply(player) {
      addPet(player, { id: "companionSpark", name: "Companion Spark", color: "#f2b85b", damage: 10, cooldownMax: 0.85, slow: 0.8 });
    }
  },
  {
    id: "arcaneWisp",
    type: "Pet",
    name: "Arcane Wisp",
    rarity: "rare",
    maxCount: 1,
    description: "A floating pet follows you and shoots nearby enemies.",
    apply(player) {
      addPet(player, { id: "arcaneWisp", name: "Arcane Wisp", color: "#73a9ff", damage: 12, cooldownMax: 1.05 });
    }
  },
  {
    id: "bloodPrice",
    type: "Stat",
    name: "Blood Price",
    rarity: "rare",
    description: "+80% damage in exchange for 30% max HP.",
    apply(player) {
      player.statBonuses.attackDamage += 0.8;
      player.maxHp = Math.max(1, Math.ceil(player.maxHp * 0.7));
      player.hp = Math.min(player.hp, player.maxHp);
    }
  },
  {
    id: "ascendantCore",
    type: "Stat",
    name: "Ascendant Core",
    rarity: "rare",
    maxCount: 3,
    description: "+15% damage, +10% speed, and ultimate cooldown is 10% faster.",
    apply(player) {
      player.statBonuses.attackDamage += 0.15;
      player.statBonuses.moveSpeed += 0.1;
      player.statBonuses.abilityCooldown += 0.1;
    }
  },
  {
    id: "whirlwindRadius",
    type: "Evolution",
    classId: "swordsman",
    grantsExtraAbility: true,
    name: "Guard Breaker",
    rarity: "rare",
    description: "Unlock an extra swordsman ability: an invincible spear dash that pierces enemies.",
    apply(player) {
      player.abilityMods.pullRadius += 45;
      player.abilityMods.smashRadius += 30;
      player.extraAbilityId = "guardBreaker";
    }
  },
  {
    id: "whirlwindBlades",
    type: "Ability",
    classId: "swordsman",
    name: "Cyclone Blades",
    rarity: "rare",
    description: "Whirlwind Smash fires blade waves after the slam.",
    apply(player) {
      player.abilityUpgrades.add("whirlwindBlades");
    }
  },
  {
    id: "netSize",
    type: "Evolution",
    classId: "archer",
    grantsExtraAbility: true,
    name: "Arrow Storm",
    rarity: "rare",
    description: "Unlock an extra archer ability: a volley of arrows that leaves slowing ice patches.",
    apply(player) {
      player.abilityMods.netRadius += 42;
      player.abilityMods.netDuration += 0.65;
      player.extraAbilityId = "arrowStorm";
    }
  },
  {
    id: "netThorns",
    type: "Ability",
    classId: "archer",
    name: "Thorn Net",
    rarity: "rare",
    description: "Caught enemies take an extra thorn burst.",
    apply(player) {
      player.abilityUpgrades.add("netThorns");
    }
  },
  {
    id: "poisonTrail",
    type: "Passive",
    name: "Poison Trail",
    rarity: "epic",
    maxCount: 1,
    description: "Leave poison while moving. You take 10% more damage.",
    apply(player) {
      player.passives.add("poisonTrail");
    }
  },
  {
    id: "combo",
    type: "Passive",
    name: "Combo",
    rarity: "epic",
    maxCount: 1,
    description: "Every fifth attack deals an additional 100% damage.",
    apply(player) {
      player.passives.add("combo");
    }
  },
  {
    id: "tanky",
    type: "Stat",
    name: "Tanky",
    rarity: "epic",
    maxCount: 5,
    description: "Max HP +100%.",
    apply(player) {
      player.maxHp *= 2;
      player.hp *= 2;
    }
  },
  {
    id: "buff",
    type: "Stat",
    name: "Buff",
    rarity: "epic",
    maxCount: 5,
    description: "Damage +100%.",
    apply(player) {
      player.statBonuses.attackDamage += 1;
    }
  },
  {
    id: "zoom",
    type: "Stat",
    name: "Zoom",
    rarity: "epic",
    maxCount: 3,
    description: "Speed +50%.",
    apply(player) {
      player.statBonuses.moveSpeed += 0.5;
    }
  },
  {
    id: "bodyguards",
    type: "Ability",
    name: "Bodyguards",
    rarity: "epic",
    maxCount: 1,
    description: "Summon 2 bodyguards as pet allies.",
    apply(player) {
      player.passives.add("bodyguards");
      addPet(player, { id: "bodyguardA", name: "Bodyguard", color: "#afa89e", damage: 9, cooldownMax: 1.1 });
      addPet(player, { id: "bodyguardB", name: "Bodyguard", color: "#afa89e", damage: 9, cooldownMax: 1.1 });
    }
  },
  {
    id: "bodyguards2",
    type: "Ability",
    name: "Bodyguards 2",
    rarity: "epic",
    maxCount: 3,
    requiresReward: "bodyguards",
    description: "Add 2 more bodyguards and improve pet damage.",
    apply(player) {
      player.statBonuses.petDamage += 0.1;
      addPet(player, { id: `bodyguard-${player.rewardCount("bodyguards2")}-a`, name: "Bodyguard", color: "#afa89e", damage: 10, cooldownMax: 1.05 });
      addPet(player, { id: `bodyguard-${player.rewardCount("bodyguards2")}-b`, name: "Bodyguard", color: "#afa89e", damage: 10, cooldownMax: 1.05 });
    }
  },
  {
    id: "bigAttack",
    type: "Stat",
    name: "Woah, that's big",
    rarity: "epic",
    maxCount: 3,
    description: "Attack range and size increase by 30%.",
    apply(player) {
      player.statBonuses.rangeSize += 0.3;
    }
  },
  {
    id: "armyDrills",
    type: "Stat",
    name: "Army Drills",
    rarity: "epic",
    maxCount: 5,
    description: "Pets and summons deal 20% more damage.",
    apply(player) {
      player.statBonuses.petDamage += 0.2;
    }
  },
  {
    id: "reload",
    type: "Stat",
    name: "Reload",
    rarity: "epic",
    maxCount: 1,
    description: "Skill cooldown -30%.",
    apply(player) {
      player.statBonuses.abilityCooldown += 0.3;
    }
  },
  {
    id: "epicEgg",
    type: "Pet",
    name: "Epic Egg",
    rarity: "epic",
    maxCount: 6,
    description: "Hatches into an epic pet ally.",
    apply(player) {
      addEpicEgg(player);
    }
  },
  {
    id: "vampiricLegacy",
    type: "Passive",
    name: "Vampiric Legacy",
    rarity: "legendary",
    maxCount: 3,
    description: "+1% lifesteal.",
    apply(player) {
      player.statBonuses.lifesteal += 0.01;
    }
  },
  {
    id: "onGuard",
    type: "Passive",
    name: "On Guard",
    rarity: "legendary",
    maxCount: 1,
    description: "Every 5 seconds, gain a 1 second invulnerable shield.",
    apply(player) {
      player.passives.add("onGuard");
      player.onGuardTimer = 5;
    }
  },
  {
    id: "despair",
    type: "Stat",
    name: "Despair",
    rarity: "legendary",
    maxCount: 2,
    description: "+10% chance to stun enemies on hit.",
    apply(player) {
      player.statBonuses.stunChance += 0.1;
    }
  },
  {
    id: "steroids",
    type: "Stat",
    name: "Steroids",
    rarity: "legendary",
    maxCount: 1,
    description: "Max HP and damage +75%, speed +40%, attack speed +30%.",
    apply(player) {
      const gain = Math.ceil(player.maxHp * 0.75);
      player.maxHp += gain;
      player.hp += gain;
      player.statBonuses.attackDamage += 0.75;
      player.statBonuses.moveSpeed += 0.4;
      player.statBonuses.attackSpeed += 0.3;
    }
  }
];

const shopPool = [
  {
    id: "shopHealthPot",
    type: "Heal",
    name: "Health pot",
    rarity: "common",
    stockChance: 1,
    baseCost: 30,
    description: "Heal 50% max HP immediately.",
    apply(player) {
      player.heal(Math.ceil(player.maxHp * 0.5));
    }
  },
  {
    ...rewardPool.find((reward) => reward.id === "epicEgg"),
    stockChance: 0.1,
    baseCost: 1000,
    costIncrement: 500
  },
  {
    id: "hiddenQuestline",
    type: "Quest",
    name: "Sealed Errand",
    rarity: "rare",
    stockChance: 0.25,
    baseCost: 300,
    unique: true,
    description: "Begin a hidden questline. Quest steps arrive later.",
    apply(player) {
      player.questlines.hidden = {
        started: true,
        stage: "ready",
        progress: 0
      };
    }
  },
  {
    id: "weaponAscensionMaterial",
    type: "Material",
    name: "Weapon evolution material",
    rarity: "uncommon",
    stockChance: 0.5,
    baseCost: 200,
    costIncrement: 50,
    description: "Gain 1 Weapon Ore.",
    apply(player) {
      player.materials.weapon += 1;
    }
  },
  {
    id: "heroAscensionMaterial",
    type: "Material",
    name: "Hero ascension material",
    rarity: "uncommon",
    stockChance: 0.5,
    baseCost: 300,
    costIncrement: 50,
    description: "Gain 1 Hero Sigil.",
    apply(player) {
      player.materials.hero += 1;
    }
  },
  {
    id: "shopCommonChest",
    type: "Chest",
    name: "Common Chest",
    rarity: "common",
    stockChance: 0.9,
    baseCost: 100,
    costIncrement: 100,
    opensChest: "common",
    description: "Open a common chest reward."
  },
  {
    id: "shopUncommonChest",
    type: "Chest",
    name: "Uncommon Chest",
    rarity: "uncommon",
    stockChance: 0.5,
    baseCost: 200,
    costIncrement: 125,
    opensChest: "uncommon",
    description: "Open an uncommon chest reward."
  },
  {
    id: "shopRareChest",
    type: "Chest",
    name: "Rare Chest",
    rarity: "rare",
    stockChance: 0.25,
    baseCost: 500,
    costIncrement: 250,
    opensChest: "rare",
    description: "Open a rare chest reward."
  },
  {
    id: "shopEpicChest",
    type: "Chest",
    name: "Epic Chest",
    rarity: "epic",
    stockChance: 0.1,
    baseCost: 1000,
    costIncrement: 500,
    opensChest: "epic",
    description: "Open an epic chest reward."
  }
];

export const rewardColors = {
  common: "#f6f1e8",
  uncommon: "#5ec28c",
  rare: "#73a9ff",
  epic: "#a747d9",
  legendary: "#f2b85b"
};

export const chestTiers = {
  common: {
    name: "Common Chest",
    color: "#8d5a38",
    rewardWeights: { common: 64, uncommon: 28, rare: 7, epic: 1 }
  },
  uncommon: {
    name: "Uncommon Chest",
    color: "#3d8f62",
    rewardWeights: { common: 42, uncommon: 39, rare: 16, epic: 3 }
  },
  rare: {
    name: "Rare Chest",
    color: "#386fc5",
    rewardWeights: { common: 22, uncommon: 40, rare: 31, epic: 7 }
  },
  epic: {
    name: "Epic Chest",
    color: "#7d3bb4",
    rewardWeights: { common: 13, uncommon: 19, rare: 35, epic: 25, legendary: 8 }
  },
  legendary: {
    name: "Legendary Chest",
    color: "#c98b21",
    rewardWeights: { uncommon: 8, rare: 26, epic: 48, legendary: 18 }
  }
};

export function rollRewardOptions(player, count = 3, chestRarity = "common") {
  return rollOptions(player, rewardPool, count, chestTiers[chestRarity]?.rewardWeights ?? chestTiers.common.rewardWeights);
}

export function rollShopOptions(player, count = 3) {
  let stock = filteredPool(player, shopPool)
    .filter((item) => Math.random() < (item.stockChance ?? 1))
    .map((item) => withShopCost(player, item));
  if (stock.length === 0) {
    const fallback = shopPool.find((item) => item.id === "shopHealthPot");
    return fallback ? [withShopCost(player, fallback)] : [];
  }
  const maxStock = Math.max(1, count + (player.passives.has("luckyPouch") ? 1 : 0));
  if (stock.length > maxStock) {
    const always = stock.find((item) => item.id === "shopHealthPot");
    const rest = stock.filter((item) => item.id !== "shopHealthPot").sort(() => Math.random() - 0.5);
    stock = always ? [always, ...rest].slice(0, maxStock) : rest.slice(0, maxStock);
  }
  return stock;
}

function rollOptions(player, pool, count, weights) {
  const options = [];
  const used = new Set();
  const available = filteredPool(player, pool);
  const maxOptions = Math.min(count, available.length);
  while (options.length < maxOptions) {
    const reward = rollReward(available.filter((candidate) => !used.has(candidate.id)), weights);
    if (!reward) {
      break;
    }
    if (!used.has(reward.id)) {
      options.push(reward);
      used.add(reward.id);
    }
  }
  return options;
}

function filteredPool(player, pool) {
  return pool.filter((reward) => {
    if (!canApplyReward(player, reward)) {
      return false;
    }
    if (reward.classId && reward.classId !== player.character.classId) {
      return false;
    }
    if (reward.requiresBlueprint && !player.blueprints[reward.requiresBlueprint]) {
      return false;
    }
    if (reward.requiresReward && !player.hasReward(reward.requiresReward)) {
      return false;
    }
    if (reward.maxCount !== undefined && player.rewardCount(reward.id) >= reward.maxCount) {
      return false;
    }
    if (reward.maxCount === undefined && ["Passive", "Ability", "Pet", "Evolution"].includes(reward.type) && player.hasReward(reward.id)) {
      return false;
    }
    if (reward.unique && player.hasReward(reward.id)) {
      return false;
    }
    return true;
  });
}

export function canApplyReward(player, reward) {
  if (reward.id === "epicEgg" && player.rewardCount("epicEgg") >= 5 && !player.passives.has("fairyHatched")) {
    return false;
  }
  if (reward.requiresBlueprint && !player.blueprints[reward.requiresBlueprint]) {
    return false;
  }
  if (reward.requiresReward && !player.hasReward(reward.requiresReward)) {
    return false;
  }
  if (reward.maxCount !== undefined && player.rewardCount(reward.id) >= reward.maxCount) {
    return false;
  }
  if (reward.maxCount === undefined && ["Passive", "Ability", "Pet", "Evolution"].includes(reward.type) && player.hasReward(reward.id)) {
    return false;
  }
  if (reward.grantsExtraAbility) {
    if (player.canMannequinTransform) {
      return false;
    }
    if (player.extraAbilityId) {
      return false;
    }
  }
  return true;
}

function withShopCost(player, item) {
  const bought = player.shopPurchaseCount(item.id);
  return {
    ...item,
    cost: (item.baseCost ?? item.cost ?? 0) + bought * (item.costIncrement ?? 0)
  };
}

function rollReward(pool, weights) {
  if (pool.length === 0) {
    return null;
  }
  const total = pool.reduce((sum, reward) => sum + (weights[reward.rarity] ?? 1), 0);
  let pick = Math.random() * total;
  for (const reward of pool) {
    pick -= weights[reward.rarity] ?? 1;
    if (pick <= 0) {
      return reward;
    }
  }
  return pool[0];
}

export function applyReward(player, reward) {
  if (!canApplyReward(player, reward)) {
    return false;
  }
  if (reward.apply) {
    reward.apply(player);
  }
  player.rewardHistory.push(reward.id);
  if (reward.baseCost !== undefined || reward.cost !== undefined) {
    player.shopHistory.push(reward.id);
  }
  player.lastReward = reward;
  return true;
}
