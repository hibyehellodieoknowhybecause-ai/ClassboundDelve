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

const rewardPool = [
  {
    id: "maxHp",
    type: "Stat",
    name: "Heart Core",
    rarity: "common",
    description: "+24 max HP and heal 24 HP.",
    apply(player) {
      player.maxHp += 24;
      player.hp = Math.min(player.maxHp, player.hp + 24);
    }
  },
  {
    id: "attackDamage",
    type: "Stat",
    name: "Sharpened Focus",
    rarity: "common",
    description: "+16% attack damage.",
    apply(player) {
      player.statBonuses.attackDamage += 0.16;
    }
  },
  {
    id: "attackSpeed",
    type: "Stat",
    name: "Quick Hands",
    rarity: "common",
    description: "Weapon cooldown is 12% faster.",
    apply(player) {
      player.statBonuses.attackSpeed += 0.12;
    }
  },
  {
    id: "moveSpeed",
    type: "Stat",
    name: "Fleet Boots",
    rarity: "common",
    description: "+9% movement speed.",
    apply(player) {
      player.statBonuses.moveSpeed += 0.09;
    }
  },
  {
    id: "dashTraining",
    type: "Stat",
    name: "Dash Training",
    rarity: "uncommon",
    description: "Dash cooldown is 18% faster.",
    apply(player) {
      player.statBonuses.dashCooldown += 0.18;
    }
  },
  {
    id: "ultimateBattery",
    type: "Ability",
    name: "Ultimate Battery",
    rarity: "uncommon",
    description: "Ultimate cooldown is 15% faster.",
    apply(player) {
      player.statBonuses.abilityCooldown += 0.15;
    }
  },
  {
    id: "potionBelt",
    type: "Passive",
    name: "Potion Belt",
    rarity: "uncommon",
    description: "Health pots heal 35% more.",
    apply(player) {
      player.passives.add("potionBelt");
    }
  },
  {
    id: "secondHeart",
    type: "Passive",
    name: "Second Heart",
    rarity: "rare",
    description: "Once per run, lethal damage revives you at 45% HP.",
    apply(player) {
      player.passives.add("secondHeart");
      player.reviveAvailable = true;
    }
  },
  {
    id: "arcaneWisp",
    type: "Pet",
    name: "Arcane Wisp",
    rarity: "rare",
    description: "A floating pet follows you and shoots nearby enemies.",
    apply(player) {
      player.pets.push({
        id: "arcaneWisp",
        name: "Arcane Wisp",
        angle: Math.random() * Math.PI * 2,
        cooldown: 0.6,
        color: "#73a9ff"
      });
    }
  },
  {
    id: "ascendantCore",
    type: "Evolution",
    name: "Ascendant Core",
    rarity: "legendary",
    description: "+20% damage, +12% speed, and ultimate cooldown is 20% faster.",
    apply(player) {
      player.statBonuses.attackDamage += 0.2;
      player.statBonuses.moveSpeed += 0.12;
      player.statBonuses.abilityCooldown += 0.2;
    }
  },
  {
    id: "whirlwindRadius",
    type: "Evolution",
    classId: "swordsman",
    grantsExtraAbility: true,
    name: "Guard Breaker",
    rarity: "uncommon",
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
    rarity: "uncommon",
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
  }
];

const shopPool = [
  {
    id: "shopHealthPot",
    type: "Shop",
    name: "Quarter-Heart Flask",
    rarity: "common",
    cost: 30,
    description: "Heal 25% max HP immediately.",
    apply(player) {
      player.heal(Math.ceil(player.maxHp * 0.25));
    }
  },
  {
    id: "hiddenQuestline",
    type: "Quest",
    name: "Sealed Errand",
    rarity: "uncommon",
    cost: 300,
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
    name: "Weapon Ascension Ore",
    rarity: "rare",
    cost: 180,
    requiresBlueprint: "weaponEvolution",
    description: "Material for completing weapon upgrade blueprints.",
    apply(player) {
      player.materials.weapon += 1;
    }
  },
  {
    id: "heroAscensionMaterial",
    type: "Material",
    name: "Hero Ascension Sigil",
    rarity: "legendary",
    cost: 220,
    requiresBlueprint: "heroAscension",
    description: "Material for future hero ascension crafting.",
    apply(player) {
      player.materials.hero += 1;
    }
  }
];

export const rewardColors = {
  common: "#f6f1e8",
  uncommon: "#5ec28c",
  rare: "#73a9ff",
  legendary: "#f2b85b"
};

export const chestTiers = {
  common: {
    name: "Common Chest",
    color: "#8d5a38",
    rewardWeights: { common: 64, uncommon: 28, rare: 7, legendary: 1 }
  },
  uncommon: {
    name: "Uncommon Chest",
    color: "#3d8f62",
    rewardWeights: { common: 42, uncommon: 39, rare: 16, legendary: 3 }
  },
  rare: {
    name: "Rare Chest",
    color: "#386fc5",
    rewardWeights: { common: 22, uncommon: 40, rare: 31, legendary: 7 }
  },
  legendary: {
    name: "Legendary Chest",
    color: "#c98b21",
    rewardWeights: { common: 8, uncommon: 26, rare: 48, legendary: 18 }
  }
};

export function rollRewardOptions(player, count = 3, chestRarity = "common") {
  return rollOptions(player, rewardPool, count, chestTiers[chestRarity]?.rewardWeights ?? chestTiers.common.rewardWeights);
}

export function rollShopOptions(player, count = 3) {
  return rollOptions(player, shopPool, Math.max(1, Math.ceil(Math.random() * count)), { common: 70, uncommon: 18, rare: 9, legendary: 3 });
}

function rollOptions(player, pool, count, weights) {
  const options = [];
  const used = new Set();
  const available = filteredPool(player, pool);
  const maxOptions = Math.min(count, available.length);
  while (options.length < maxOptions) {
    const reward = rollReward(available.filter((candidate) => !used.has(candidate.id)), weights);
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
    if ((reward.unique || reward.type === "Passive" || reward.type === "Ability" || reward.type === "Pet") && player.hasReward(reward.id)) {
      return false;
    }
    return true;
  });
}

export function canApplyReward(player, reward) {
  if (reward.requiresBlueprint && !player.blueprints[reward.requiresBlueprint]) {
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

function rollReward(pool, weights) {
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
  reward.apply(player);
  player.rewardHistory.push(reward.id);
  player.lastReward = reward;
  return true;
}
