import { clamp, distance, randomRange } from "./utils/math.js";
import { chestTiers } from "./data/rewards.js";

const roomChestWeights = {
  common: 58,
  uncommon: 31,
  rare: 9,
  epic: 1,
  legendary: 1
};

const bossChestWeights = {
  common: 0,
  uncommon: 18,
  rare: 46,
  epic: 24,
  legendary: 12
};

export function createRewardChest(x, y, source = "reward chest", rarity = "common") {
  const tier = chestTiers[rarity] ?? chestTiers.common;
  return {
    id: `reward-${Math.random().toString(16).slice(2)}`,
    type: "chest",
    source,
    rarity,
    name: tier.name,
    x,
    y,
    radius: 34,
    color: tier.color,
    opened: false,
    bob: Math.random() * Math.PI * 2
  };
}

export function createHealthPotion(x, y, healAmount = 32) {
  return {
    id: `health-${Math.random().toString(16).slice(2)}`,
    type: "healthPotion",
    x,
    y,
    radius: 22,
    healAmount,
    color: "#d95757",
    bob: Math.random() * Math.PI * 2
  };
}

export function createBlueprintDrop(blueprintId, name, player, x, y, description = "") {
  return {
    id: `blueprint-${blueprintId}-${player.playerIndex}-${Math.random().toString(16).slice(2)}`,
    type: "blueprint",
    blueprintId,
    name,
    playerIndex: player.playerIndex,
    playerLabel: player.label,
    description,
    x,
    y,
    radius: 28,
    color: "#73a9ff",
    bob: Math.random() * Math.PI * 2
  };
}

export function createMaterialDrop(material, amount, player, x, y) {
  const isCore = material === "weaponCore";
  const name = isCore ? "Tempered Core" : "Weapon Ore";
  return {
    id: `material-${material}-${player.playerIndex}-${Math.random().toString(16).slice(2)}`,
    type: "material",
    material,
    amount,
    name,
    playerIndex: player.playerIndex,
    playerLabel: player.label,
    x,
    y,
    radius: isCore ? 24 : 21,
    color: isCore ? "#f2b85b" : "#73a9ff",
    bob: Math.random() * Math.PI * 2
  };
}

export function createGoldBar(x, y) {
  return {
    id: `gold-bar-${Math.random().toString(16).slice(2)}`,
    type: "goldBar",
    name: "Gold Bar",
    x,
    y,
    radius: 25,
    color: "#f2b85b",
    bob: Math.random() * Math.PI * 2
  };
}

export function createShop(x, y) {
  return {
    id: `shop-${Math.random().toString(16).slice(2)}`,
    type: "shop",
    name: "Classbound Shop",
    x,
    y,
    radius: 38,
    color: "#f2b85b",
    stock: null,
    bob: Math.random() * Math.PI * 2
  };
}

export function createQuestPortal(x, y) {
  return {
    id: "hidden-quest-portal",
    type: "questPortal",
    name: "Hidden Quest Portal",
    x,
    y,
    radius: 44,
    color: "#a747d9",
    bob: 0
  };
}

export function createSage(x, y) {
  return {
    id: "sage",
    type: "sage",
    name: "Maze Sage",
    x,
    y,
    radius: 34,
    color: "#f2b85b",
    bob: Math.random() * Math.PI * 2
  };
}

export function createLobbyCharacter(character, x, y) {
  return {
    id: `lobby-character-${character.id}`,
    type: "lobbyCharacter",
    characterId: character.id,
    name: character.name,
    role: character.role,
    x,
    y,
    radius: 38,
    color: character.color,
    accent: character.accent,
    bob: Math.random() * Math.PI * 2
  };
}

export function createLobbyPortal(x, y) {
  return {
    id: "lobby-dungeon-portal",
    type: "lobbyPortal",
    name: "Dungeon Gate",
    x,
    y,
    radius: 48,
    color: "#73a9ff",
    bob: 0
  };
}

export function createLobbySpot(id, name, x, y) {
  return {
    id,
    type: "lobbySpot",
    name,
    x,
    y,
    radius: 34,
    color: "#afa89e",
    bob: Math.random() * Math.PI * 2
  };
}

export function createPortal(x, y) {
  return {
    id: "portal",
    type: "portal",
    x,
    y,
    radius: 42,
    color: "#73a9ff",
    bob: 0
  };
}

export function spawnRewardLoot(stage, player) {
  const rarity = rollChestRarity(stage);
  const chestRadius = 34;
  const drops = [
    createRewardChest(
      boundedLootX(stage.room, player.x + randomRange(-70, 70), chestRadius),
      boundedLootY(stage.room, player.y + randomRange(-55, 55), chestRadius),
      stage.isBoss ? "boss reward" : "room reward",
      rarity
    )
  ];
  if (isShopStage(stage.number)) {
    const shopRadius = 38;
    drops.push(createShop(
      boundedLootX(stage.room, player.x + randomRange(92, 138), shopRadius),
      boundedLootY(stage.room, player.y + randomRange(-64, 64), shopRadius)
    ));
  }
  drops.push(createPortal(stage.room.width / 2, stage.room.margin + 78));
  return drops;
}

function boundedLootX(room, x, radius) {
  return clamp(x, room.margin + radius, room.width - room.margin - radius);
}

function boundedLootY(room, y, radius) {
  return clamp(y, room.margin + radius, room.height - room.margin - radius);
}

export function isShopStage(stageNumber) {
  const floorAfterBoss = ((stageNumber - 1) % 5) + 1;
  return floorAfterBoss === 2 || floorAfterBoss === 4;
}

function rollChestRarity(stage) {
  const weights = stage.isBoss ? bossChestWeights : roomChestWeights;
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
  let pick = Math.random() * total;
  for (const [rarity, weight] of Object.entries(weights)) {
    pick -= weight;
    if (pick <= 0) {
      return rarity;
    }
  }
  return stage.isBoss ? "rare" : "common";
}

export function nearestInteractable(loot, player) {
  let best = null;
  let bestDistance = Infinity;
  for (const item of loot) {
    if ((item.type === "blueprint" || item.type === "material") && item.playerIndex !== player.playerIndex) {
      continue;
    }
    const reach = item.type === "portal" || item.type === "questPortal" || item.type === "lobbyPortal" ? 86 : item.type === "shop" || item.type === "sage" || item.type === "lobbyCharacter" || item.type === "lobbySpot" || item.type === "goldBar" ? 78 : 62;
    const bonusReach = player.passives?.has("magnetCharm") ? reach * 2 : reach;
    const dist = distance(item, player);
    if (dist <= bonusReach && dist < bestDistance) {
      best = item;
      bestDistance = dist;
    }
  }
  return best;
}
