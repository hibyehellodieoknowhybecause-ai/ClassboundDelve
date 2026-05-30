export const CLASS_IDS = {
  SWORDSMAN: "swordsman",
  ARCHER: "archer",
  NEUTRAL: "neutral"
};

export const weapons = {
  ironSaber: {
    id: "ironSaber",
    name: "Iron Saber",
    rarity: "common",
    classes: [CLASS_IDS.SWORDSMAN],
    kind: "melee",
    damageBonus: 0,
    cooldown: 0.34,
    range: 82,
    arc: (Math.PI * 2) / 3,
    knockback: 125,
    hitAllInRange: false,
    slashStyle: "redSaber",
    slashLife: 0.22,
    slashColor: "#ff3b30",
    slashAccent: "#ffd1c2",
    hitTextColor: "#ff6b5f",
    description: "A basic sword that provides attack shape only. Damage comes from the character."
  },
  elmLongbow: {
    id: "elmLongbow",
    name: "Elm Longbow",
    rarity: "common",
    classes: [CLASS_IDS.ARCHER],
    kind: "projectile",
    damageBonus: 0,
    cooldown: 0.48,
    projectileSpeed: 760,
    projectileLife: 0.85,
    spread: 0,
    description: "A basic bow that provides attack shape only. Damage comes from the character."
  },
  sparkPistol: {
    id: "sparkPistol",
    name: "Spark Pistol",
    rarity: "common",
    classes: [CLASS_IDS.NEUTRAL],
    kind: "projectile",
    damageBonus: 0,
    cooldown: 0.18,
    projectileSpeed: 680,
    projectileLife: 0.72,
    spread: 0.1,
    description: "Neutral sidearm with no class lockout and steady pressure."
  },
  stormHalberd: {
    id: "stormHalberd",
    name: "Storm Halberd",
    rarity: "rare",
    classes: [CLASS_IDS.SWORDSMAN, CLASS_IDS.ARCHER],
    kind: "melee",
    damageBonus: 0,
    cooldown: 0.56,
    range: 108,
    arc: 1.25,
    knockback: 170,
    description: "A rare hybrid weapon that supports both swordsman and archer ultimates."
  },
  emberCleaver: {
    id: "emberCleaver",
    name: "Ember Cleaver",
    rarity: "uncommon",
    classes: [CLASS_IDS.SWORDSMAN],
    kind: "melee",
    damageBonus: 0,
    cooldown: 0.72,
    range: 120,
    arc: 1.9,
    knockback: 230,
    description: "A heavy swordsman blade with a wide fiery swing."
  },
  frostRapier: {
    id: "frostRapier",
    name: "Frost Rapier",
    rarity: "uncommon",
    classes: [CLASS_IDS.SWORDSMAN],
    kind: "projectile",
    damageBonus: 0,
    cooldown: 0.3,
    projectileSpeed: 820,
    projectileLife: 0.62,
    projectileCount: 1,
    slow: 1.1,
    spread: 0,
    description: "A duelist sword that fires short frost thrusts to slow enemies."
  },
  thornRepeater: {
    id: "thornRepeater",
    name: "Thorn Repeater",
    rarity: "uncommon",
    classes: [CLASS_IDS.ARCHER],
    kind: "projectile",
    damageBonus: 0,
    cooldown: 0.32,
    projectileSpeed: 780,
    projectileLife: 0.8,
    projectileCount: 3,
    spread: 0.16,
    description: "A quick archer weapon that fires tight bursts of thorn arrows."
  },
  moonSnareBow: {
    id: "moonSnareBow",
    name: "Moon Snare Bow",
    rarity: "rare",
    classes: [CLASS_IDS.ARCHER],
    kind: "projectile",
    damageBonus: 0,
    cooldown: 0.72,
    projectileSpeed: 700,
    projectileLife: 0.95,
    projectileCount: 1,
    slow: 1.6,
    spread: 0,
    description: "A rare bow whose arrows briefly slow their targets."
  },
  glassComet: {
    id: "glassComet",
    name: "Glass Comet",
    rarity: "rare",
    classes: [CLASS_IDS.NEUTRAL],
    kind: "projectile",
    damageBonus: 0,
    cooldown: 1.05,
    projectileSpeed: 560,
    projectileLife: 1.15,
    projectileCount: 1,
    spread: 0,
    description: "A neutral relic that launches slow, brutal comet shots."
  },
  twinFang: {
    id: "twinFang",
    name: "Twin Fang",
    rarity: "rare",
    classes: [CLASS_IDS.SWORDSMAN, CLASS_IDS.ARCHER],
    kind: "projectile",
    damageBonus: 0,
    cooldown: 0.42,
    projectileSpeed: 830,
    projectileLife: 0.72,
    projectileCount: 2,
    spread: 0.22,
    description: "A hybrid weapon with two angled shots and class support for both heroes."
  },
  mysteriousNuke: {
    id: "mysteriousNuke",
    name: "Mysterious Nuke",
    rarity: "legendary",
    classes: [CLASS_IDS.NEUTRAL],
    kind: "nuke",
    damage: 9999,
    cooldown: 5.5,
    range: 9999,
    hidden: true,
    description: "A hidden doomsday weapon that clears every enemy in the room."
  }
};

export const rarityColors = {
  common: "#f6f1e8",
  uncommon: "#5ec28c",
  rare: "#73a9ff",
  legendary: "#f2b85b"
};

export const lootTable = Object.values(weapons).filter((weapon) => !weapon.hidden);

export function weaponMatchesClass(weapon, classId) {
  return weapon.classes.includes(classId);
}

export function formatWeaponClasses(weapon) {
  if (weapon.classes.includes(CLASS_IDS.NEUTRAL)) {
    return "Neutral";
  }
  return weapon.classes.map((classId) => classId[0].toUpperCase() + classId.slice(1)).join(" / ");
}

export function weaponStats(weapon, player = null) {
  if (!weapon) {
    return "No weapon loaded";
  }

  const stats = [];
  if (weapon.kind === "nuke") {
    stats.push(`DMG ${weapon.damage}`);
  } else if (player) {
    stats.push(`Base DMG ${player.baseDamage}`);
  }

  const damageBonus = (weapon.damageBonus ?? 0) + (player?.weaponEvolution?.damageBonus ?? 0) + (player?.statBonuses?.attackDamage ?? 0);
  if (damageBonus > 0) {
    stats.push(`DMG +${Math.round(damageBonus * 100)}%`);
  }

  stats.push(`CD ${weapon.cooldown}s`);

  if (weapon.kind === "nuke") {
    stats.push("Room clear");
  } else if (weapon.kind === "melee") {
    stats.push(`Range ${weapon.range}`);
  } else {
    stats.push(`Shots ${weapon.projectileCount ?? 1}`);
    stats.push(`Speed ${weapon.projectileSpeed}`);
  }

  if (weapon.slow) {
    stats.push(`Slow ${weapon.slow}s`);
  }

  return stats.join("  ");
}
